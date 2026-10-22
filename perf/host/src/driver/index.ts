import {
  readersOfNewestOwn,
  type RowChanges,
  stopWatchingRows,
  watchRows,
} from '../channels';
import type { PerfHostConfig } from '../config';
import { type EventFixture, replay, startRecording, stopRecording } from '../events';
import {
  deliveredCount,
  type Delivery,
  idle,
  startDelivery,
  stopDelivery,
} from '../live';
import { mark, MARKS, perfMarks, whenChannelListReady } from '../marks';
import {
  loadedMarkers,
  markerState,
  newestMarker,
  oldestLoaded,
  stopAnchors,
  viewPosition,
  watchAnchors,
  type AnchorRecord,
} from '../messages';
import { getNavigation } from '../navigation';
import { recordings } from '../observers';
import {
  type RenderSummary,
  rendersAvailable,
  startCounting,
  stopCounting,
} from '../renders';
import { settle, type SettleResult } from '../settle';

// window.__perf: what the runner calls. The runner makes at most one call per measured window and
// reads snapshot() only after the window closes (WEB-SCENARIOS.md §1.4). More methods arrive with
// the steps that need them. `renders` and `events` are setup/teardown calls
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

/**
 * Opens a channel through the SDK's workspace navigation (what a row click calls) and resolves when
 * the view has settled with `expectText` (e.g. the newest marker "[2000]") on screen.
 */
const openChannel = (cid: string, expectText: string): Promise<SettleResult> => {
  const trigger = performance.now();
  mark(MARKS.open, trigger);
  getNavigation().open(cid);
  return settle(trigger, expectText);
};

/** Closes a channel and resolves once its view is gone. */
const back = async (cid: string) => {
  getNavigation().close(cid);
  for (let i = 0; i < 100 && document.querySelector('.str-chat__channel'); i++) {
    await new Promise((r) => setTimeout(r, 50));
  }
};

export type PerfDriver = {
  /** Open `cid` and settle on `expectText` (WEB-PLAN.md §5.5). */
  openChannel: (cid: string, expectText: string) => Promise<SettleResult>;
  /** Close `cid`, back to the channel list alone. */
  back: (cid: string) => Promise<void>;
  /** Message-list state from the SDK (read outside gestures, never during one). */
  messages: {
    oldestLoaded: (cid: string) => boolean;
    loadedMarkers: (cid: string) => number[];
    newestMarker: (cid: string) => string;
    viewPosition: (cid: string) => ReturnType<typeof viewPosition>;
    markerState: (cid: string, marker: number) => ReturnType<typeof markerState>;
    watchAnchors: (cid: string) => void;
    stopAnchors: () => AnchorRecord[];
  };
  /** Channel-list rows leaving and joining during a window, for the `rows-changed` gate. */
  channels: {
    watchRows: () => void;
    stopWatchingRows: () => RowChanges;
  };
  /** Other members who have read the newest own message in `cid` (ML-12's receipt check). */
  readers: (cid: string) => { readers: number; sentAt: number | null };
  /** The measured idle window of a live run: `perf:window-start` → `perf:window-end` after `ms`. */
  idle: (ms: number) => Promise<number>;
  /** Live messages (`[9NNN]`) the client received for `cid`, for the `live-delivered` gate. */
  live: {
    startDelivery: (cid: string) => void;
    delivered: () => number;
    stopDelivery: () => Delivery;
  };
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
    back,
    channels: { stopWatchingRows, watchRows },
    events: { replay, startRecording, stopRecording },
    idle,
    live: { delivered: deliveredCount, startDelivery, stopDelivery },
    messages: {
      loadedMarkers,
      markerState,
      newestMarker,
      oldestLoaded,
      stopAnchors,
      viewPosition,
      watchAnchors,
    },
    openChannel,
    readers: readersOfNewestOwn,
    ready: whenChannelListReady,
    renders: { available: rendersAvailable, start: startCounting, stop: stopCounting },
    snapshot,
  };
};
