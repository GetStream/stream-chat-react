// Every `chatperf live` command the runner's scenarios send, as data: the scenarios build their
// command lines from here, and the contract test (contract.test.ts) checks each entry against
// chatperf's registry (`chatperf scenarios --json`): the scenario exists and is live, and its rate
// and duration are the canonical ones, unless `reason` says why this one differs on purpose.

export type LiveSpec = {
  /** The chatperf scenario whose live profile runs. */
  scenario: string;
  rate?: number;
  duration?: number;
  count?: number;
  channels?: number;
  /** Why this command deliberately differs from the registry's canonical rate/duration. */
  reason?: string;
};

export const LIVE = {
  'cl-06': { duration: 60, rate: 3, scenario: 'cl-06' },
  'cl-07': { duration: 60, rate: 2, scenario: 'cl-07' },
  'cl-08': { duration: 60, rate: 1, scenario: 'cl-08' },
  'cl-09': { duration: 60, rate: 1, scenario: 'cl-09' },
  'cp-01': { duration: 60, rate: 5, scenario: 'ml-08' },
  'ml-08': { duration: 60, rate: 5, scenario: 'ml-08' },
  'ml-08-oldest': { duration: 60, rate: 5, scenario: 'ml-08' },
  'ml-08-scrolled-up': { duration: 60, rate: 5, scenario: 'ml-08' },
  'ml-09': { duration: 30, rate: 16, scenario: 'ml-09' },
  'ml-10': { duration: 60, rate: 4, scenario: 'ml-10' },
  'ml-10-top-up': {
    count: 30,
    rate: 10,
    reason:
      'preparation, not a window: 30 fresh messages so ML-10 targets rows on screen',
    scenario: 'ml-08',
  },
  'ml-11': { duration: 60, rate: 4, scenario: 'ml-11' },
  'ml-12': { duration: 60, rate: 2, scenario: 'ml-12' },
  'of-02': { channels: 20, count: 200, scenario: 'of-02' },
  'sk-01': { duration: 600, scenario: 'sk-01' },
  'sk-01-60m': { duration: 3600, reason: 'the 60-minute variant', scenario: 'sk-01' },
  'th-02': { duration: 60, rate: 3, scenario: 'th-02' },
  'wb-01': {
    duration: 420,
    rate: 5,
    reason:
      'longer than intensive throttling’s 5-minute threshold (WEB-SCENARIOS.md WB-01)',
    scenario: 'ml-08',
  },
} satisfies Record<string, LiveSpec>;

/** The command-line arguments after `chatperf live`. */
export const liveArgs = (spec: LiveSpec) => [
  spec.scenario,
  ...(spec.rate !== undefined ? ['--rate', String(spec.rate)] : []),
  ...(spec.duration !== undefined ? ['--duration', String(spec.duration)] : []),
  ...(spec.count !== undefined ? ['--count', String(spec.count)] : []),
  ...(spec.channels !== undefined ? ['--channels', String(spec.channels)] : []),
];
