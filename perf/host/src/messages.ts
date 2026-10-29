import type { StreamChat } from 'stream-chat';

import { getNavigation } from './navigation';

// Message-list state the runner needs, read from the SDK rather than the DOM (WEB-PLAN.md §5.5):
// whether the oldest page is loaded, which markers are loaded, and whether prepending an older page
// kept the reader's place.

let client: StreamChat | undefined;
export const setMessagesClient = (c: StreamChat) => {
  client = c;
};

/** `cid`, or 'thread' for the open thread's replies (both lists read the same paginators, F7). */
const paginatorOf = (cid: string) => {
  if (cid === 'thread') {
    const thread = getNavigation().thread();
    if (!thread) throw new Error('no thread is open');
    return thread.messagePaginator;
  }
  const channel = client?.channelManager.get(cid);
  if (!channel) throw new Error(`${cid} is not loaded`);
  return channel.messagePaginator;
};

// History markers are [0001]…[2000]; live ones count from [9001] and pass [9999] after 999 events.
const MARKER = /\[(\d{4,})\]/;
const markerOf = (text: string | undefined) => {
  const m = text?.match(MARKER);
  return m ? Number(m[1]) : null;
};

/** `hasMoreTail === false`: the oldest page is loaded (verified in step 1, Q1). */
export const oldestLoaded = (cid: string) => {
  const state = paginatorOf(cid).state.getLatestValue();
  return state.hasMoreTail === false && !state.isLoading;
};

/** The paginator's raw flags (evidence for a discarded run, and diagnostics). */
export const paginatorFlags = (cid: string) => {
  const s = paginatorOf(cid).state.getLatestValue();
  return {
    hasMoreHead: s.hasMoreHead,
    hasMoreTail: s.hasMoreTail,
    isLoading: s.isLoading,
    items: (s.items ?? []).length,
  };
};

/** Loaded main-list messages, with or without a marker (a deleted message has none). */
export const loadedCount = (cid: string) =>
  (paginatorOf(cid).state.getLatestValue().items ?? []).length;

/**
 * For each check, whether the row carrying `marker` is in the DOM and contains `selector`
 * (ML-07's kinds-rendered gate). A row is found by its marker text, or, for `afterMarker`, as the
 * row right after that marker's row (a deleted message keeps no text).
 */
export type KindCheck = {
  kind: string;
  marker: number;
  selector: string;
  afterMarker?: boolean;
};
export const kindsInDom = (checks: KindCheck[]) => {
  // The standard list renders a system message outside any `.str-chat__li` row.
  const rows = [
    ...document.querySelectorAll<HTMLElement>(
      '.str-chat__li, .str-chat__message--system',
    ),
  ].filter((el) => el.matches('.str-chat__li') || !el.closest('.str-chat__li'));
  const found: string[] = [];
  for (const check of checks) {
    const text = `[${String(check.marker).padStart(4, '0')}]`;
    const index = rows.findIndex((row) => row.textContent?.includes(text));
    if (index < 0) continue;
    const row = check.afterMarker ? rows[index + 1] : rows[index];
    if (row?.querySelector(check.selector) || row?.matches(check.selector))
      found.push(check.kind);
  }
  return found;
};

/** The `[NNNN]` markers of the loaded messages, oldest first. */
export const loadedMarkers = (cid: string) =>
  ((paginatorOf(cid).state.getLatestValue().items ?? []) as Array<{ text?: string }>)
    .map((m) => markerOf(m.text))
    .filter((n): n is number => n !== null);

/** The newest loaded message's marker, formatted as it appears on screen ("[2000]"). */
export const newestMarker = (cid: string) => {
  const last = loadedMarkers(cid).at(-1);
  if (last === undefined) throw new Error(`${cid} has no loaded marked messages`);
  return `[${String(last).padStart(4, '0')}]`;
};

/** The marker of the message row at the top of the message list's viewport. */
export const topVisibleMarker = (): number | null => {
  const scroller = document.querySelector('[data-perf-scroller]') as HTMLElement | null;
  if (!scroller) return null;
  const r = scroller.getBoundingClientRect();
  // The very top can be a date separator or the paginator's loading row (it is, at scrollTop 0),
  // so probe a few points down until one hits a message row.
  for (const dy of [8, 40, 80, 120, 200, 300]) {
    const row = document
      .elementFromPoint(r.x + r.width / 2, r.y + dy)
      ?.closest('.str-chat__li, [data-item-index]');
    const marker = markerOf(row?.textContent ?? undefined);
    if (marker !== null) return marker;
  }
  return null;
};

/**
 * Where the reader is: the top visible marker, how many loaded messages are newer than it (how far
 * up the list the view sits), and how many are loaded in all.
 */
export const viewPosition = (cid: string) => {
  const top = topVisibleMarker();
  const markers = loadedMarkers(cid);
  // Every chatperf live run numbers its messages from [9001] again, so after a few runs a live
  // marker can appear more than once. The reader of a live run is at or near the newest messages,
  // so the newest copy is the one on screen.
  const index = top === null ? -1 : markers.lastIndexOf(top);
  // Unambiguous where markers repeat: how far the view is from the newest end, in pixels.
  const el = document.querySelector('[data-perf-scroller]') as HTMLElement | null;
  return {
    fromBottomPx: el
      ? Math.round(el.scrollHeight - el.scrollTop - el.clientHeight)
      : null,
    loaded: markers.length,
    /** How many loaded messages carry the top row's marker (more than 1 after repeated live runs). */
    markerCopies: top === null ? 0 : markers.filter((m) => m === top).length,
    newerThanTop: index < 0 ? null : markers.length - 1 - index,
    top,
  };
};

/** Whether a message is still loaded, and whether its row is on screen inside the scroller. */
export const markerState = (cid: string, marker: number) => {
  const loaded = loadedMarkers(cid).includes(marker);
  const scroller = document.querySelector('[data-perf-scroller]');
  const box = scroller?.getBoundingClientRect();
  const text = `[${String(marker).padStart(4, '0')}]`;
  const row = [...document.querySelectorAll('.str-chat__li, [data-item-index]')].find(
    (el) => el.textContent?.includes(text),
  );
  const r = row?.getBoundingClientRect();
  const onScreen = !!(box && r && r.bottom > box.top && r.top < box.bottom);
  return { loaded, onScreen };
};

/** The marker of the message row at the bottom of the message list's viewport (WB-02). */
export const bottomVisibleMarker = (): number | null => {
  const scroller = document.querySelector('[data-perf-scroller]') as HTMLElement | null;
  if (!scroller) return null;
  const r = scroller.getBoundingClientRect();
  for (const dy of [8, 40, 80, 120, 200]) {
    const row = document
      .elementFromPoint(r.x + r.width / 2, r.bottom - dy)
      ?.closest('.str-chat__li, [data-item-index]');
    const marker = markerOf(row?.textContent ?? undefined);
    if (marker !== null) return marker;
  }
  return null;
};

export type AnchorRecord = {
  before: number | null;
  after: number | null;
  loaded: number;
};
let anchors: AnchorRecord[] = [];
let stopWatching: (() => void) | undefined;

/**
 * Watches every prepend of an older page: the top visible marker just before the new page is
 * committed (the paginator publishes before React renders) and two frames later. A list that keeps
 * the reader's place shows the same marker, give or take the rows the fling itself moved meanwhile.
 */
export const watchAnchors = (cid: string) => {
  anchors = [];
  stopWatching?.();
  let oldest = loadedMarkers(cid)[0];
  stopWatching = paginatorOf(cid).state.subscribe(() => {
    const markers = loadedMarkers(cid);
    if (markers[0] === undefined || markers[0] === oldest) return;
    oldest = markers[0];
    const before = topVisibleMarker();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        anchors.push({ after: topVisibleMarker(), before, loaded: markers.length });
      }),
    );
  });
};

export const stopAnchors = () => {
  stopWatching?.();
  stopWatching = undefined;
  return anchors;
};

/** The reply count of the loaded message in `cid` whose text contains `text` (TH-02's parent). */
export const replyCount = (cid: string, text: string) => {
  const items = (paginatorOf(cid).state.getLatestValue().items ?? []) as Array<{
    text?: string;
    reply_count?: number;
  }>;
  return items.find((m) => m.text?.includes(text))?.reply_count ?? null;
};
