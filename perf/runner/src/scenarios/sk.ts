import { LIVE, liveArgs } from './live-specs.ts';
import { live } from '../chatperf.ts';
import { afterGc, detachedNodes, peak, sampleMemory, writeChart } from '../memory.ts';
import type { MemorySample } from '../memory.ts';
import { openNewest } from './ml-live.ts';
import { mlCid } from './ml-15.ts';
import type { MeasureContext, RunScenario } from './run.ts';

// SK-01 / SK-02: mixed soak (WEB-PLAN.md SK-01, SK-02). `chatperf live sk-01` sends 7.5 events/s
// (messages, reactions, typing, edits) to the open ML-01 channel and 10 background channels for
// 10 minutes. At minutes 5–6 the reader opens another channel and comes back, 5 times.
//
// One window, two rows: SK-01 = M-MEM (peak heap, with the 1 Hz curve as a chart), SK-02 = M-CPU
// (the whole window's average, with the first and last minute beside it). `sk-01-60m` runs an hour.
//
// Gate: live-achieved. On livestream the paginator must never hold more than the cap (230), which
// is read once a minute.

const NAV_AT_S = 300;
const NAV_TIMES = 5;
const CAP = 230;

/** Main-thread busy % between two samples. */
const busy = (a: MemorySample, b: MemorySample) =>
  Math.round(((b.taskS - a.taskS) / Math.max(b.t - a.t, 1)) * 1000) / 10;

const at = (samples: MemorySample[], t: number) =>
  samples.reduce((best, s) => (Math.abs(s.t - t) < Math.abs(best.t - t) ? s : best));

const soak = (id: 'sk-01' | 'sk-01-60m'): RunScenario => ({
  alsoRows: [
    {
      id: id === 'sk-01' ? 'sk-02' : `${id}-cpu`,
      key: 'cpuPct',
      metric: 'M-CPU',
      unit: '%',
    },
  ],
  context: 'fresh',
  dataset: {
    // The foreground is ML-01's channel; the 10 background channels are sk-01's own seed, added
    // without wiping ML-01.
    seed: [
      ['seed', 'ml-01', '--yes'],
      ['seed', 'sk-01', '--no-isolate', '--concurrency', '4', '--yes'],
    ],
    verify: 'sk-01',
  },
  id,
  lists: true,
  measure: async (ctx: MeasureContext) => {
    const { cdp, page, type } = ctx;
    const cid = mlCid(type);
    await openNewest(page, cid);
    const others = (await page.evaluate(() => window.__perf!.channels.listCids()))
      .filter((c) => c !== cid)
      .slice(0, NAV_TIMES);

    const start = await afterGc(cdp);
    const sampler = sampleMemory(cdp);
    const run = live([
      ...liveArgs(LIVE[id]),
      '--countdown',
      '3',
      '--no-isolate',
      '--channel-type',
      type,
    ]);
    const goAt = await run.go;
    if (goAt === null)
      throw new Error(`chatperf live ended before GO:\n${(await run.done).output}`);
    sampler.label('go');

    let maxLoaded = 0;
    let navigated = false;
    let finished = false;
    void run.done.then(() => {
      finished = true;
    });
    while (!finished) {
      await page.waitForTimeout(5000);
      const elapsed = (Date.now() - goAt) / 1000;
      if (!navigated && elapsed >= NAV_AT_S) {
        navigated = true;
        sampler.label('navigate ×5');
        for (const other of others) {
          await page.evaluate((c) => window.__perf!.switchChannels(c), [other, cid]);
        }
        sampler.label('back');
      }
      if (Math.floor(elapsed) % 60 < 5) {
        maxLoaded = Math.max(
          maxLoaded,
          await page.evaluate((c) => window.__perf!.messages.loadedCount(c), cid),
        );
      }
    }
    const result = await run.done;
    const { labels, samples } = await sampler.stop();
    const end = await afterGc(cdp);
    const detached = await detachedNodes(cdp);
    if (result.code !== 0 || !result.finished) {
      throw new Error(`chatperf live failed:\n${result.output.trim()}`);
    }

    const goT = labels.find((l) => l.label === 'go')!.t;
    const inWindow = samples.filter((s) => s.t >= goT);
    const first = inWindow[0];
    const last = inWindow.at(-1)!;
    const gates: string[] = [];
    if (result.finished.discard) {
      gates.push(
        `live-achieved: chatperf reached ${Math.round((result.finished.achieved_ratio ?? 0) * 100)}% ` +
          'of the requested rate',
      );
    }
    if (type === 'livestream' && maxLoaded > CAP) {
      gates.push(`cap: the paginator held ${maxLoaded} messages (cap ${CAP})`);
    }
    const top = peak(inWindow);
    return {
      extra: {
        achievedPct: Math.round((result.finished.achieved_ratio ?? 0) * 100),
        chart: await writeChart(
          `mem-${id}-${type}-${ctx.list}-i${ctx.iteration}-${Date.now()}`,
          samples,
          labels,
        ),
        cpuFirstMinutePct: busy(first, at(inWindow, first.t + 60)),
        cpuLastMinutePct: busy(at(inWindow, last.t - 60), last),
        cpuPct: busy(first, last),
        detached,
        end,
        listenersEnd: end.listeners,
        listenersStart: start.listeners,
        maxLoaded,
        peak: top,
        sent: result.finished.sent,
        start,
      },
      gates,
      value: top.heapMB,
    };
  },
  metric: 'M-MEM',
  types: ['messaging', 'livestream'],
  unit: 'MB',
});

export const sk01 = soak('sk-01');
export const sk0160m = soak('sk-01-60m');
