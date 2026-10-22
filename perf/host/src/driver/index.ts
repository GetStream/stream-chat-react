import {
  readersOfNewestOwn,
  type RowChanges,
  existingCids,
  listCids,
  stopWatchingRows,
  unreadCounts,
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
  bottomVisibleMarker,
  kindsInDom,
  type KindCheck,
  loadedCount,
  loadedMarkers,
  markerState,
  newestMarker,
  oldestLoaded,
  paginatorFlags,
  replyCount,
  stopAnchors,
  viewPosition,
  watchAnchors,
  type AnchorRecord,
} from '../messages';
import { getNavigation } from '../navigation';
import { keyInteractions, recordings } from '../observers';
import {
  type RenderSummary,
  rendersAvailable,
  startCounting,
  stopCounting,
} from '../renders';
import { CHANNEL_LIST, settle, type SettleResult } from '../settle';
import { countHiddenChanges, hiddenChangeCount, settleAfterVisible } from '../visibility';

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

/**
 * Opens each channel in turn, the way a sidebar click does, settling each on its name in the header
 * before the next. One call per window (CS-01, CS-02, SK-01's navigation).
 */
const switchChannels = async (cids: string[]) => {
  const results: Array<{ cid: string; durationMs: number }> = [];
  for (const cid of cids) {
    const data = window.__perfHost?.client.channelManager.get(cid)?.data as
      | { name?: string }
      | undefined;
    const name = data?.name ?? '';
    const { durationMs } = await openChannel(cid, name);
    results.push({ cid, durationMs });
  }
  return results;
};

/**
 * Opens the thread of the message in `cid` whose text contains `parentText` (it must be loaded), and
 * resolves when the thread has settled with `expectText` (e.g. its newest reply's marker).
 */
const openThread = (cid: string, parentText: string, expectText: string) => {
  const channel = window.__perfHost?.client.channelManager.get(cid);
  const message = (channel?.messagePaginator.state.getLatestValue().items ?? []).find(
    (m) => m.text?.includes(parentText),
  );
  if (!channel || !message)
    throw new Error(`no loaded message in ${cid} contains "${parentText}"`);
  const trigger = performance.now();
  mark(MARKS.threadOpen, trigger);
  getNavigation().openThread(cid, message);
  return settle(trigger, expectText);
};

/**
 * The id a jump goes to (ML-13), resolved before the window: 'quote' = the message the newest loaded
 * message quotes; 'pinned' = the pinned message whose text contains `text` (from the server).
 */
const jumpTarget = async (cid: string, route: 'quote' | 'pinned', text: string) => {
  const channel = window.__perfHost?.client.channelManager.get(cid);
  if (!channel) throw new Error(`${cid} is not loaded`);
  if (route === 'quote') {
    const items = (channel.messagePaginator.state.getLatestValue().items ?? []) as Array<{
      quoted_message_id?: string;
      quoted_message?: { id: string };
    }>;
    const quoting = [...items].reverse().find((m) => m.quoted_message_id);
    if (!quoting) throw new Error(`no loaded message in ${cid} quotes another`);
    return quoting.quoted_message_id!;
  }
  const { messages } = await channel.getPinnedMessages({ limit: 50 });
  const pinned = messages.find((m) => m.text?.includes(text));
  if (!pinned) throw new Error(`no pinned message in ${cid} contains "${text}"`);
  return pinned.id;
};

/**
 * Jumps to a message the way a quote or a pinned-message click does (`jumpToMessage`), and resolves
 * when the view has settled (quiet, nothing loading). Whether it landed is checked afterwards.
 */
const jumpTo = (cid: string, messageId: string) => {
  const channel = window.__perfHost?.client.channelManager.get(cid);
  if (!channel) throw new Error(`${cid} is not loaded`);
  const trigger = performance.now();
  mark(MARKS.jump, trigger);
  void channel.messagePaginator.jumpToMessage(messageId);
  return settle(trigger, '');
};

/**
 * OF-02/03: starts watching the channel list now and resolves when it has settled with `expectText`
 * (the burst's newest marker in a preview). The runner arms it, then brings the page back online.
 */
const settleList = (expectText: string, timeoutMs = 60_000) =>
  settle(performance.now(), expectText, { timeoutMs, watched: CHANNEL_LIST });

/** The WebSocket's health from the v10 store (`went-offline` gate). */
const wsHealthy = () =>
  window.__perfHost?.client.wsConnection.state.getLatestValue().isHealthy ?? false;

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
  /** Open a thread beside its channel and settle on `expectText` (TH-01, TH-03). */
  openThread: (
    cid: string,
    parentText: string,
    expectText: string,
  ) => Promise<SettleResult>;
  /** M-INP: key interactions since `fromMs`, and the page's interaction count. */
  keyInteractions: (fromMs: number) => {
    durations: number[];
    interactionCount: number | null;
  };
  /** WB-01: DOM changes made while hidden (opt-in), and the settle armed for coming back. */
  hidden: {
    countChanges: () => void;
    changeCount: () => number;
    settleAfterVisible: (expectText: string, timeoutMs?: number) => Promise<SettleResult>;
  };
  /** OF-02/03: settle on the channel list (arm it before going back online). */
  settleList: (expectText: string, timeoutMs?: number) => Promise<SettleResult>;
  wsHealthy: () => boolean;
  /** ML-13: the message id a quote or pinned jump goes to (resolved before the window). */
  jumpTarget: (cid: string, route: 'quote' | 'pinned', text: string) => Promise<string>;
  /** ML-13: jump to `messageId` and settle. */
  jumpTo: (cid: string, messageId: string) => Promise<SettleResult>;
  /** Open each channel in turn, settling each (WEB-PLAN.md CS-01/CS-02). */
  switchChannels: (cids: string[]) => Promise<Array<{ cid: string; durationMs: number }>>;
  /** Close `cid`, back to the channel list alone. */
  back: (cid: string) => Promise<void>;
  /** Message-list state from the SDK (read outside gestures, never during one). */
  messages: {
    oldestLoaded: (cid: string) => boolean;
    paginatorFlags: (cid: string) => ReturnType<typeof paginatorFlags>;
    loadedMarkers: (cid: string) => number[];
    loadedCount: (cid: string) => number;
    replyCount: (cid: string, text: string) => number | null;
    bottomVisibleMarker: () => number | null;
    kindsInDom: (checks: KindCheck[]) => string[];
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
    unreadCounts: () => Record<string, number>;
    listCids: () => string[];
    existingCids: (cids: string[]) => Promise<string[]>;
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
    channels: { existingCids, listCids, stopWatchingRows, unreadCounts, watchRows },
    events: { replay, startRecording, stopRecording },
    hidden: {
      changeCount: hiddenChangeCount,
      countChanges: countHiddenChanges,
      settleAfterVisible,
    },
    idle,
    live: { delivered: deliveredCount, startDelivery, stopDelivery },
    messages: {
      bottomVisibleMarker,
      kindsInDom,
      loadedCount,
      loadedMarkers,
      markerState,
      newestMarker,
      oldestLoaded,
      paginatorFlags,
      replyCount,
      stopAnchors,
      viewPosition,
      watchAnchors,
    },
    jumpTarget,
    jumpTo,
    keyInteractions,
    openChannel,
    openThread,
    readers: readersOfNewestOwn,
    ready: whenChannelListReady,
    renders: { available: rendersAvailable, start: startCounting, stop: stopCounting },
    settleList,
    snapshot,
    switchChannels,
    wsHealthy,
  };
};
