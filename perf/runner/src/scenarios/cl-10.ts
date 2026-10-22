import { splitAt } from '../collect.ts';
import type { RunScenario } from './run.ts';

// CL-10: first visit, cold browser → M-LAUNCH (WEB-SCENARIOS.md §3). A fresh context per iteration:
// no HTTP cache, no storage. navigationStart → perf:channel-list-ready, with the queryChannels
// request's network share beside it.

// v10 queries channels at /api/v2/chat/channels (checked 2026-10-21, stream-chat 10.0.0-rc.22).
export const QUERY_CHANNELS = /\/channels\/?$/;

export const channelListLaunch: RunScenario['measure'] = async ({ page }) => {
  const value = await page.evaluate(() => window.__perf!.ready());
  const split = await splitAt(page, 'perf:channel-list-ready', QUERY_CHANNELS);
  return { split, value };
};

export const cl10: RunScenario = {
  context: 'fresh',
  dataset: { seed: ['seed', 'cl-01', '--concurrency', '4', '--yes'], verify: 'cl-01' },
  id: 'cl-10',
  lists: false,
  measure: channelListLaunch,
  metric: 'M-LAUNCH',
  types: ['messaging'],
  unit: 'ms',
};
