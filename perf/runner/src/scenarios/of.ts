import { LIVE, liveArgs } from './live-specs.ts';
import { live } from '../chatperf.ts';
import { frameStats, startFrameTrace } from '../frames.ts';
import type { RunScenario } from './run.ts';

// Offline and reconnect (WEB-PLAN.md OF-02, OF-03), on CL-01's data. One window, two rows:
//
//   OF-02  M-FRAMES from going back online until the channel list has settled
//   OF-03  M-SETTLE: `perf:online` (the WebSocket healthy again) → the list settled with the burst's
//          newest marker, [9200], in a preview
//
// The chain: load → `context.setOffline(true)` (the client goes unhealthy, step 1 Q2) → gate
// went-offline → `chatperf live of-02` (200 messages over 20 channels, never wipes) → gate
// stayed-offline (none of them reached the page) → window: online → settled.
// `of-02-messagelist` does the same with one of the 20 channels open.
//
// The newest marker is the same every run, so every iteration starts from a fresh CL-01 seed.
// Validation only (PERF_GATE_CHECK_ONLINE=1): skip going offline; went-offline must fail.

const NEWEST = '[9200]';

const reconnect = (variant: 'list' | 'messagelist'): RunScenario => ({
  alsoRows: [
    {
      id: variant === 'list' ? 'of-03' : 'of-03-messagelist',
      key: 'settleFromOnlineMs',
      metric: 'M-SETTLE',
      unit: 'ms',
    },
  ],
  context: 'fresh',
  dataset: {
    reseed: 'per-iteration',
    seed: ['seed', 'cl-01', '--concurrency', '4', '--yes'],
    verify: 'cl-01',
  },
  id: variant === 'list' ? 'of-02' : 'of-02-messagelist',
  lists: variant === 'messagelist',
  measure: async ({ context, page }) => {
    await page.evaluate(() => window.__perf!.ready());
    if (variant === 'messagelist') {
      // chatperf's burst goes to the first 20 channels of the CL-01 manifest; the first gets [9200].
      await page.evaluate(
        (c) => window.__perf!.openChannel(c, ''),
        'messaging:perf-cl-01-00001',
      );
    }
    const gates: string[] = [];
    if (process.env.PERF_GATE_CHECK_ONLINE !== '1') await context.setOffline(true);
    await page.waitForTimeout(1000);
    if (await page.evaluate(() => window.__perf!.wsHealthy())) {
      gates.push('went-offline: the WebSocket stayed healthy, so the burst arrived live');
    }

    await page.evaluate(() => window.__perf!.live.startDelivery('*'));
    const burst = await live([...liveArgs(LIVE['of-02']), '--countdown', '0']).done;
    if (burst.code !== 0)
      throw new Error(`chatperf live of-02 failed:\n${burst.output.trim()}`);
    const whileOffline = await page.evaluate(() => window.__perf!.live.delivered());
    if (whileOffline && !gates.length) {
      gates.push(`stayed-offline: ${whileOffline} burst messages arrived while offline`);
    }

    const stopTrace = await startFrameTrace(page.context().browser()!);
    const settling = page.evaluate((m) => window.__perf!.settleList(m), NEWEST);
    await context.setOffline(false);
    const settled = await settling;
    const trace = await stopTrace();
    const delivery = await page.evaluate(() => window.__perf!.live.stopDelivery());
    const online = await page.evaluate(
      () => performance.getEntriesByName('perf:online', 'mark').at(-1)?.startTime ?? null,
    );
    const frames = frameStats(trace);
    return {
      extra: {
        ...frames,
        deliveredLiveAfterOnline: delivery.count,
        sent: burst.finished?.sent ?? null,
        settleFromOnlineMs: online === null ? null : Math.round(settled.settled - online),
        settleFromReconnectCallMs: Math.round(settled.durationMs),
      },
      gates,
      value: frames.droppedPct,
    };
  },
  metric: 'M-FRAMES',
  types: ['messaging'],
  unit: '%',
});

export const of02 = reconnect('list');
export const of02Messagelist = reconnect('messagelist');
