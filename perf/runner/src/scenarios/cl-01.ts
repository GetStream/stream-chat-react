import { channelListLaunch } from './cl-10.ts';
import type { RunScenario } from './run.ts';

// CL-01: channel list reload → M-LAUNCH (WEB-SCENARIOS.md §3). One context: the first load (not
// measured) warms the HTTP cache and storage, then each iteration is a reload. On web the channels
// still come over the network; what's warm is the bundle. The CL-01 ÷ CL-10 pair is therefore NOT
// comparable with mobile's, where it splits a local-DB read from the network.

export const cl01: RunScenario = {
  context: 'reload',
  dataset: { seed: ['seed', 'cl-01', '--concurrency', '4', '--yes'], verify: 'cl-01' },
  id: 'cl-01',
  lists: false,
  measure: async (ctx) => {
    const result = await channelListLaunch(ctx);
    // Proof the reload is warm: scripts whose bytes actually came over the network this time.
    const scriptsFromNetwork = await ctx.page.evaluate(
      () =>
        performance
          .getEntriesByType('resource')
          .map((e) => e as PerformanceResourceTiming)
          .filter((e) => e.initiatorType === 'script' && e.transferSize > 0).length,
    );
    return { ...result, extra: { scriptsFromNetwork } };
  },
  metric: 'M-LAUNCH',
  types: ['messaging'],
  unit: 'ms',
};
