// The M-RENDERS scenarios of the fast track (ML-09, ML-11, CL-07). Each one says what to open, which
// chatperf live run produces its events, and which dataset that run storms.
//
// Live runs use --no-isolate: a render count needs the scenario's data present, not a fresh seed per
// run, and isolation would re-seed (ML-01 takes ~10 minutes). The dataset is seeded once, by hand or
// by `--seed`, and the replay check catches a fixture recorded on a different seed.

export type RenderScenario = {
  id: string;
  /** chatperf scenario that seeds the dataset the live run storms. */
  dataset: { scenario: string; seedArgs: string[] };
  /** Channel to open before the window; null = stay on the channel list. */
  openChannel: { cid: string; title: string } | null;
  /** `chatperf live` arguments (after `live`). */
  live: string[];
  /** Which list implementations to run: the channel-list scenario only needs one. */
  lists: Array<'standard' | 'virtualized'>;
  /**
   * How a replay gets back to the recording's starting state.
   *   'same-seed'  the fixture names message ids of one seed, so replay on that seed, never re-seed
   *                (reactions, typing: the events don't depend on what the server holds)
   *   'fresh-seed' the events' effect depends on server state the live run changed (channel names),
   *                so replay re-seeds first; channel ids are deterministic, so the fixture still fits
   */
  replayStart: 'same-seed' | 'fresh-seed';
};

const COUNTDOWN = ['--countdown', '3', '--no-isolate', '--yes'];

export const RENDER_SCENARIOS: Record<string, RenderScenario> = {
  // 16 reaction add/removes per second on the 10 newest (visible) messages: in-place updates only.
  'ml-09': {
    dataset: { scenario: 'ml-01', seedArgs: ['seed', 'ml-01', '--yes'] },
    id: 'ml-09',
    live: ['ml-09', '--rate', '16', '--duration', '30', ...COUNTDOWN],
    lists: ['standard', 'virtualized'],
    openChannel: { cid: 'messaging:perf-ml-01', title: 'ML-01' },
    replayStart: 'same-seed',
  },
  // Typing start/stop from up to 5 users at 4 cycles/s. A typing event targets no message, so every
  // message row that renders is untargeted.
  'ml-11': {
    dataset: { scenario: 'ml-01', seedArgs: ['seed', 'ml-01', '--yes'] },
    id: 'ml-11',
    live: ['ml-11', '--rate', '4', '--duration', '60', ...COUNTDOWN],
    lists: ['standard', 'virtualized'],
    openChannel: { cid: 'messaging:perf-ml-01', title: 'ML-01' },
    replayStart: 'same-seed',
  },
  // 2 channel.updated events/s across visible channels, at the top of the channel list.
  'cl-07': {
    dataset: {
      scenario: 'cl-06',
      seedArgs: ['seed', 'cl-06', '--concurrency', '4', '--yes'],
    },
    id: 'cl-07',
    live: ['cl-07', '--rate', '2', '--duration', '60', ...COUNTDOWN],
    lists: ['virtualized'],
    openChannel: null,
    // Measured 2026-10-20: replayed after the live run (channels already renamed), CL-07 rendered
    // 11 rows/commit against live's 23; from a fresh CL-06 seed, 21 against 23.
    replayStart: 'fresh-seed',
  },
};
