import type { PerfHostConfig } from '../config';
import { type EventFixture, replay, startRecording, stopRecording } from '../events';
import { perfMarks, whenChannelListReady } from '../marks';
import { recordings } from '../observers';
import {
  type RenderSummary,
  rendersAvailable,
  startCounting,
  stopCounting,
} from '../renders';

// window.__perf: what the runner calls. The runner makes at most one call per measured window and
// reads snapshot() only after the window closes (WEB-SCENARIOS.md §1.4). More methods arrive with
// the steps that need them (openChannel, idle, …). `renders` and `events` are setup/teardown calls
// around a render-count window; they never time anything.

export type PerfSnapshot = ReturnType<typeof snapshot>;

let hostConfig: Omit<PerfHostConfig, 'apiKey' | 'token'> | undefined;

const snapshot = () => ({
  build: __PERF_BUILD__,
  // Credentials are left out: snapshots end up in result files.
  config: hostConfig,
  marks: perfMarks(),
  ...recordings(),
});

export type PerfDriver = {
  /** Resolves at `perf:channel-list-ready`, with its startTime. */
  ready: () => Promise<number>;
  snapshot: () => PerfSnapshot;
  /** M-RENDERS (dev and profiling builds only): count rows rendered per commit. */
  renders: {
    available: boolean;
    start: () => void;
    stop: () => RenderSummary;
  };
  /** Record the events the client receives, or replay a recording at a fixed cadence. */
  events: {
    startRecording: (cid: string | null) => void;
    stopRecording: () => EventFixture;
    replay: (fixture: EventFixture, options: { intervalMs: number }) => Promise<number>;
  };
};

declare global {
  interface Window {
    __perf?: PerfDriver;
  }
}

export const installDriver = (config: PerfHostConfig | undefined) => {
  if (config) {
    const { apiKey: _apiKey, token: _token, ...rest } = config;
    hostConfig = rest;
  }
  window.__perf = {
    events: { replay, startRecording, stopRecording },
    ready: whenChannelListReady,
    renders: { available: rendersAvailable, start: startCounting, stop: stopCounting },
    snapshot,
  };
};
