import type { Iteration } from '../browser.ts';
import type { Split } from '../collect.ts';
import type { ChannelType, ListImplementation } from '../config.ts';

// A measured scenario (`perf run <id>`). Each one declares its dataset, which grid axes apply, how an
// iteration starts, and how its one number is read (WEB-SCENARIOS.md: one scenario, one metric).

export type Metric = 'M-LAUNCH' | 'M-SETTLE' | 'M-FRAMES' | 'M-MEM' | 'M-CPU' | 'M-INP';

export type MeasureContext = Iteration & {
  /** The host URL for this cell of the grid (credentials included). */
  url: string;
  type: ChannelType;
  list: ListImplementation;
  /** 1-based; iteration 1 is dropped from the median. */
  iteration: number;
};

export type Measurement = {
  value: number;
  /** For M-LAUNCH / M-SETTLE: the network/client split beside the total. */
  split?: Split;
  extra?: Record<string, unknown>;
  /** Failed correctness gates. Non-empty = the iteration is discarded, with these reasons. */
  gates?: string[];
};

export type RunScenario = {
  id: string;
  metric: Metric;
  unit: string;
  /**
   * chatperf arguments that seed the dataset, and the scenario `verify` checks before measuring.
   * `reseed: 'per-batch'` (live runs that mutate the dataset): one seed and one verify for the whole
   * batch of iterations; a later batch needs a fresh seed, since verify fails on the mutated data
   * (WEB-PLAN.md §10.2). `reseed: 'per-iteration'`: each iteration uses the dataset up (ML-12's
   * receipts, CL-08's ordering, CL-09's deletes), so the runner re-seeds and verifies before every
   * iteration after the first.
   */
  dataset: {
    /** One chatperf seed command, or several in order (later ones with --no-isolate). */
    seed: string[] | string[][];
    /** The scenario `chatperf verify` checks; absent when there is nothing to verify (WB-03). */
    verify?: string;
    reseed?: 'per-batch' | 'per-iteration';
  };
  /**
   * Further rows read off the same iterations (SK-02 is SK-01's run, measuring CPU): each takes its
   * value from every kept measurement's `extra[key]`.
   */
  alsoRows?: Array<{ id: string; metric: Metric; unit: string; key: string }>;
  types: ChannelType[];
  /** true: run once per list implementation. false: the list isn't on screen. */
  lists: boolean;
  /**
   * 'fresh': a new browser context every iteration (cold).
   * 'reload': one context, the first load unmeasured, then a reload per iteration (warm HTTP cache).
   */
  context: 'fresh' | 'reload';
  /** true: `measure` loads the URL itself (WB-03 traces the load from before navigation). */
  selfNavigate?: boolean;
  /** Runs the window and reads the number, after the page has loaded the URL. */
  measure: (ctx: MeasureContext) => Promise<Measurement>;
};
