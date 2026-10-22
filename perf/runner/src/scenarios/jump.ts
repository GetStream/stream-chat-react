import { requestsBetween } from '../collect.ts';
import { openNewest } from './ml-live.ts';
import type { RunScenario } from './run.ts';

// ML-13: jump to a deep message → M-SETTLE (WEB-PLAN.md ML-13), on 3 000 messages. Two routes, one
// row each, both through the paginator's `jumpToMessage` (what a quote click and a pinned-message
// click call):
//   ml-13         the newest message quotes [0250]: jump to the quoted message
//   ml-13-pinned  every 500th message is pinned: jump to the pinned [1500]
//
// Gate jump-landed: after settling, the target row is on screen. Settling waits for quiet and no
// loading indicator, not for the marker, because the quoting message shows "[0250]" too. Beside the
// number: the requests the jump made (one around-message query, not ~10 pages).

const route = (id: string, kind: 'quote' | 'pinned', target: number): RunScenario => ({
  context: 'fresh',
  dataset: { seed: ['seed', 'ml-13', '--yes'], verify: 'ml-13' },
  id,
  lists: true,
  measure: async ({ page, type }) => {
    const cid = `${type}:perf-ml-13`;
    const marker = `[${String(target).padStart(4, '0')}]`;
    await openNewest(page, cid);
    const messageId = await page.evaluate(
      ([c, k, m]) => window.__perf!.jumpTarget(c, k as 'quote' | 'pinned', m),
      [cid, kind, marker] as const,
    );
    const result = await page.evaluate(
      ([c, m]) => window.__perf!.jumpTo(c, m),
      [cid, messageId],
    );
    const requests = await requestsBetween(page, 'perf:jump', 'perf:settled');
    const landed = await page.evaluate(
      ([c, n]) => window.__perf!.messages.markerState(c, n),
      [cid, target] as const,
    );
    const gates = landed.onScreen
      ? []
      : [
          `jump-landed: ${marker} is ${landed.loaded ? 'loaded but not on screen' : 'not loaded'}`,
        ];
    return { extra: { requests }, gates, value: result.durationMs };
  },
  metric: 'M-SETTLE',
  types: ['messaging', 'livestream'],
  unit: 'ms',
});

export const ml13 = route('ml-13', 'quote', 250);
export const ml13Pinned = route('ml-13-pinned', 'pinned', 1500);
