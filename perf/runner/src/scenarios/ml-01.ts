import { historyScroll } from '../history.ts';
import { mlCid } from './ml-15.ts';
import type { RunScenario } from './run.ts';

// ML-01: plain history scroll, the message-list frame baseline → M-FRAMES (SCENARIOS.md ML-01).
// Open perf-ml-01 settled on [2000], then G-FAST up to [0001] (history.ts: the window and gates).
// At [0001] it also records DOM nodes, heap after GC and listeners (step 4's heap check).

export const ml01: RunScenario = {
  context: 'fresh',
  dataset: { seed: ['seed', 'ml-01', '--yes'], verify: 'ml-01' },
  id: 'ml-01',
  lists: true,
  measure: async (ctx) => {
    const { rect: _rect, ...measurement } = await historyScroll(ctx, {
      cid: mlCid(ctx.type),
      expected: 2000,
      markers: 'contiguous',
      newest: '[2000]',
    });
    return measurement;
  },
  metric: 'M-FRAMES',
  types: ['messaging', 'livestream'],
  unit: '%',
};
