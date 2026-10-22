import { requestsBetween, splitAt } from '../collect.ts';
import type { ChannelType } from '../config.ts';
import type { RunScenario } from './run.ts';

// ML-15: open a 2 000-message channel → M-SETTLE (SCENARIOS.md ML-15). From the channel list, open
// perf-ml-01 through the SDK's workspace navigation; the clock runs from perf:open to the last change
// before the view settled with the newest message, [2000], on screen.

export const mlCid = (type: ChannelType) => `${type}:perf-ml-01`;
// v10's channel query/watch: /api/v2/chat/channels/<type>/<id>/query.
export const CHANNEL_QUERY = /\/channels\/[^/]+\/[^/]+\/query\/?$/;

export const ml15: RunScenario = {
  context: 'fresh',
  dataset: { seed: ['seed', 'ml-01', '--yes'], verify: 'ml-01' },
  id: 'ml-15',
  lists: true,
  measure: async ({ page, type }) => {
    await page.evaluate(() => window.__perf!.ready());
    const result = await page.evaluate(
      (cid) => window.__perf!.openChannel(cid, '[2000]'),
      mlCid(type),
    );
    const split = await splitAt(page, 'perf:settled', CHANNEL_QUERY, 'perf:open');
    const requests = await requestsBetween(page, 'perf:open', 'perf:settled');
    return { extra: { requests }, split, value: result.durationMs };
  },
  metric: 'M-SETTLE',
  types: ['messaging', 'livestream'],
  unit: 'ms',
};
