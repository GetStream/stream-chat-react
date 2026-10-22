import type { Build, ChannelType, Column } from './config.ts';
import { RUN_SCENARIOS } from './scenarios/index.ts';

// The comparison sets of WEB-SCENARIOS.md §7, for `perf run --set <name>`. Each runs its scenarios
// in order; a set may pin the grid (the nightly set is prod, chrome-desktop, messaging).

export type ScenarioSet = {
  ids: string[];
  builds?: Build[];
  columns?: Column[];
  types?: ChannelType[];
};

export const SETS: Record<string, ScenarioSet> = {
  'channel-list': { ids: ['cl-10', 'cl-01', 'cl-11', 'cl-02', 'cl-06'] },
  desktop: { ids: ['cp-01', 'cp-02', 'cs-02', 'wb-01', 'wb-02'] },
  // SK-02 is read off SK-01's window (an extra row), so it needs no entry of its own.
  leaks: { ids: ['cl-12', 'cs-01', 'sk-01', 'sk-01-60m'] },
  'message-list': { ids: ['ml-15', 'ml-01', 'ml-03', 'ml-08', 'ml-09'] },
  nightly: {
    builds: ['prod'],
    columns: ['chrome-desktop'],
    ids: ['cl-11', 'ml-15', 'ml-01', 'ml-09', 'cs-01', 'wb-03'],
    types: ['messaging'],
  },
  // OF-03 is read off OF-02's window.
  signoff: {
    columns: ['chrome-desktop', 'chrome-4x'],
    ids: [
      'cl-10',
      'cl-01',
      'cl-06',
      'ml-15',
      'ml-01',
      'ml-08',
      'ml-07',
      'th-01',
      'of-02',
      'sk-01',
      'cp-01',
      'cs-01',
      'wb-03',
    ],
  },
};

const seedKey = (id: string) => JSON.stringify(RUN_SCENARIOS[id].dataset.seed);

/**
 * Whether `id` can reuse the dataset the scenario before it in the set seeded: the same seed
 * command, and the earlier one didn't change it (no live-run reseed policy).
 */
export const reusesSeed = (ids: string[], index: number) => {
  if (index === 0) return false;
  const previous = RUN_SCENARIOS[ids[index - 1]];
  return seedKey(ids[index]) === seedKey(ids[index - 1]) && !previous.dataset.reseed;
};
