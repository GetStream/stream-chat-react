import { historyScroll } from '../history.ts';
import {
  afterGc,
  detachedNodes,
  type MemorySample,
  peak,
  sampleMemory,
  writeChart,
} from '../memory.ts';
import { median } from '../stats.ts';
import { listPass, seedC4 } from './cl-variants.ts';
import type { MeasureContext, RunScenario } from './run.ts';

// Memory and channel switching (WEB-PLAN.md CL-12, ML-17, CS-01, CS-02). M-MEM is sampled at 1 Hz
// over CDP; readings that count are taken after forced GC; detached DOM nodes are counted at the end.
//
//   CL-12  CL-02's window (500 channels down and up) → peak heap; peak nodes and after-GC beside it
//   ML-17  ML-03's window (600 messages, 40 % images) + back() + 10 s + GC → peak heap; after-exit
//   CS-01  20 channels × 3 loops, GC after each loop → end − baseline heap; per-loop growth beside it
//   CS-02  open channels 1–5 once, then switch 1→5 → median of the 4 switches (M-SETTLE)

const chartName = (ctx: MeasureContext, id: string) =>
  `mem-${id}-${ctx.type}-${ctx.list}-i${ctx.iteration}-${Date.now()}`;

export const cl12: RunScenario = {
  context: 'fresh',
  dataset: seedC4('cl-02'),
  id: 'cl-12',
  lists: false,
  measure: async (ctx) => {
    const baseline = await afterGc(ctx.cdp);
    const sampler = sampleMemory(ctx.cdp);
    const pass = await listPass(ctx, { down: 'G-FAST', rows: 500, up: 'G-FAST' });
    const { labels, samples } = await sampler.stop();
    const end = await afterGc(ctx.cdp);
    const detached = await detachedNodes(ctx.cdp);
    const top = peak(samples);
    return {
      extra: {
        afterGc: end,
        baseline,
        chart: await writeChart(chartName(ctx, 'cl-12'), samples, labels),
        detached,
        droppedPct: pass.value,
        peak: top,
        rowsLoaded: pass.extra.rowsLoaded,
      },
      gates: pass.gates,
      value: top.heapMB,
    };
  },
  metric: 'M-MEM',
  types: ['messaging'],
  unit: 'MB',
};

export const ml17: RunScenario = {
  context: 'fresh',
  dataset: { seed: ['seed', 'ml-03', '--yes'], verify: 'ml-03' },
  id: 'ml-17',
  lists: true,
  measure: async (ctx) => {
    const cid = `${ctx.type}:perf-ml-03`;
    const baseline = await afterGc(ctx.cdp);
    const sampler = sampleMemory(ctx.cdp);
    const scroll = await historyScroll(ctx, {
      cid,
      expected: 600,
      markers: 'contiguous',
      newest: '[0600]',
    });
    sampler.label('at oldest');
    await ctx.page.evaluate((c) => window.__perf!.back(c), cid);
    sampler.label('back');
    await ctx.page.waitForTimeout(10_000);
    const { labels, samples } = await sampler.stop();
    const end = await afterGc(ctx.cdp);
    const detached = await detachedNodes(ctx.cdp);
    const top = peak(samples);
    return {
      extra: {
        afterExit: end,
        baseline,
        chart: await writeChart(chartName(ctx, 'ml-17'), samples, labels),
        detached,
        droppedPct: scroll.value,
        peak: top,
      },
      gates: scroll.gates,
      value: top.heapMB,
    };
  },
  metric: 'M-MEM',
  types: ['messaging', 'livestream'],
  unit: 'MB',
};

const CL01 = seedC4('cl-01');
const SWITCH_CHANNELS = 20;
const LOOPS = 3;

export const cs01: RunScenario = {
  context: 'fresh',
  dataset: CL01,
  id: 'cs-01',
  lists: true,
  measure: async (ctx) => {
    const { cdp, page } = ctx;
    await page.evaluate(() => window.__perf!.ready());
    const cids = (await page.evaluate(() => window.__perf!.channels.listCids())).slice(
      0,
      SWITCH_CHANNELS,
    );
    const baseline = await afterGc(cdp);
    const sampler = sampleMemory(cdp);
    const loops: MemorySample[] = [];
    for (let loop = 1; loop <= LOOPS; loop++) {
      await page.evaluate((c) => window.__perf!.switchChannels(c), cids);
      // Back to channel 1, as the protocol's loop ends.
      await page.evaluate((c) => window.__perf!.switchChannels(c), [cids[0]]);
      sampler.label(`loop ${loop}`);
      loops.push(await afterGc(cdp));
    }
    const { labels, samples } = await sampler.stop();
    const detached = await detachedNodes(cdp);
    const growth = loops.map((l, i) => {
      const prev = i === 0 ? baseline : loops[i - 1];
      return {
        heapMB: Math.round((l.heapMB - prev.heapMB) * 10) / 10,
        listeners: l.listeners - prev.listeners,
        nodes: l.nodes - prev.nodes,
      };
    });
    const end = loops.at(-1)!;
    return {
      extra: {
        baseline,
        chart: await writeChart(chartName(ctx, 'cs-01'), samples, labels),
        detached,
        end,
        growthPerLoop: growth,
        listenersDelta: end.listeners - baseline.listeners,
        nodesDelta: end.nodes - baseline.nodes,
      },
      value: Math.round((end.heapMB - baseline.heapMB) * 10) / 10,
    };
  },
  metric: 'M-MEM',
  types: ['messaging'],
  unit: 'MB',
};

export const cs02: RunScenario = {
  context: 'fresh',
  dataset: CL01,
  id: 'cs-02',
  lists: true,
  measure: async ({ page }) => {
    await page.evaluate(() => window.__perf!.ready());
    const cids = (await page.evaluate(() => window.__perf!.channels.listCids())).slice(
      0,
      5,
    );
    // Warm-up: each of the five opened once.
    await page.evaluate((c) => window.__perf!.switchChannels(c), cids);
    // The measured switches: from channel 5 to 1, then 1→2→3→4→5. The first lands on a channel
    // opened a while ago; the median of the four that follow is the number.
    const switches = await page.evaluate((c) => window.__perf!.switchChannels(c), cids);
    const timed = switches.slice(1).map((s) => s.durationMs);
    return {
      extra: { switches: switches.map((s) => Math.round(s.durationMs)) },
      value: median(timed),
    };
  },
  metric: 'M-SETTLE',
  types: ['messaging'],
  unit: 'ms',
};
