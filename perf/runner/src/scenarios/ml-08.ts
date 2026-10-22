import { gesture, REST_MS, scrollerRect } from '../input.ts';
import { LIVE } from './live-specs.ts';
import { storm, stormMeasurement } from '../storm.ts';
import { openNewest } from './ml-live.ts';
import { mlCid } from './ml-15.ts';
import type { RunScenario } from './run.ts';

// ML-08: live message flood → M-FRAMES (SCENARIOS.md ML-08). `chatperf live ml-08 --rate 5
// --duration 60` storms perf-ml-01 while the reader touches nothing: at the bottom (`ml-08`), where
// every message is appended in view, or ~50 messages up (`ml-08-scrolled-up`), where they arrive
// off-screen and should cost close to nothing.
//
// Gates (WEB-PLAN.md §6.6), beside the storm's live-achieved:
//   live-delivered  every live message chatperf sent reached the client: a run that missed events
//                   measured less work than the scenario defines
//
// Validation only (PERF_GATE_CHECK_OFFLINE=1): the browser goes offline 20 s into the window for
// 10 s. live-delivered must discard the iteration.

/** How far up the scrolled-up variant sits: loaded messages newer than the top visible row. */
const SCROLLED_UP_ROWS = 50;
/** After chatperf finishes, how long the last messages get to arrive over the WebSocket. */
const DELIVERY_GRACE_MS = 5000;

const flood = (variant: 'bottom' | 'scrolled-up'): RunScenario => ({
  context: 'fresh',
  dataset: { reseed: 'per-batch', seed: ['seed', 'ml-01', '--yes'], verify: 'ml-01' },
  id: variant === 'bottom' ? 'ml-08' : 'ml-08-scrolled-up',
  lists: true,
  measure: async ({ cdp, context, page, type }) => {
    const cid = mlCid(type);
    await openNewest(page, cid);
    const rect = await scrollerRect(page, '.str-chat__li');

    const position = () =>
      page.evaluate((c) => window.__perf!.messages.viewPosition(c), cid);
    let start = await position();
    if (variant === 'scrolled-up') {
      for (let g = 0; g < 30 && (start.newerThanTop ?? 0) < SCROLLED_UP_ROWS; g++) {
        await gesture(cdp, rect, 'G-SLOW', 'up');
        await page.waitForTimeout(REST_MS);
        start = await position();
      }
      if ((start.newerThanTop ?? 0) < SCROLLED_UP_ROWS) {
        throw new Error(
          `could not scroll ${SCROLLED_UP_ROWS} messages up (at ${start.newerThanTop})`,
        );
      }
    }

    await page.evaluate((c) => window.__perf!.live.startDelivery(c), cid);
    const result = await storm({
      live: LIVE[variant === 'bottom' ? 'ml-08' : 'ml-08-scrolled-up'],
      cdp,
      duringWindow:
        process.env.PERF_GATE_CHECK_OFFLINE === '1'
          ? async () => {
              await page.waitForTimeout(20_000);
              await context.setOffline(true);
              await page.waitForTimeout(10_000);
              await context.setOffline(false);
            }
          : undefined,
      metric: 'M-FRAMES',
      page,
      type,
    });

    const sent = result.finished.by_type.messages?.sent ?? 0;
    // Messages sent in the last moments are still on their way when chatperf exits.
    for (
      let waited = 0;
      waited < DELIVERY_GRACE_MS &&
      (await page.evaluate(() => window.__perf!.live.delivered())) < sent;
      waited += 250
    ) {
      await page.waitForTimeout(250);
    }
    const delivery = await page.evaluate(() => window.__perf!.live.stopDelivery());
    if (delivery.count < sent) {
      result.gates.push(
        `live-delivered: ${delivery.count} of ${sent} live messages reached the client`,
      );
    }

    return stormMeasurement(result, {
      delivered: delivery.count,
      endPosition: await position(),
      startPosition: start,
    });
  },
  metric: 'M-FRAMES',
  types: ['messaging', 'livestream'],
  unit: '%',
});

export const ml08 = flood('bottom');
export const ml08ScrolledUp = flood('scrolled-up');
