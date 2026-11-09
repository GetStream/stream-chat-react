import type { MessagePaginator } from 'stream-chat';

/**
 * The message paginator's windows, read for people. A window (an "interval" in the SDK) is a
 * stretch of loaded messages with nothing missing in between; several can be loaded and one is
 * shown. Shared by the inspector and the scenario checks, so both describe the same state.
 *
 * Debug-only reach past the public API: the interval map and the active interval id are protected
 * fields of `BasePaginator`. Read defensively, so a rename shows no windows instead of a crash.
 */

type RawInterval = {
  hasMoreHead?: boolean;
  hasMoreTail?: boolean;
  id: string;
  /** Absent on the logical intervals: messages that arrived outside any loaded window. */
  isHead?: boolean;
  isTail?: boolean;
  itemIds: string[];
};

type PaginatorInternals = {
  _activeIntervalId?: string;
  _itemIntervals?: Map<string, RawInterval>;
};

/**
 * Tail and head as in the SDK: the tail is the channel's oldest end (the top of the message list),
 * the head its newest end (the bottom).
 */
export type MessageWindow = {
  /** The server has newer messages than this window holds. */
  canLoadHeadwards: boolean;
  /** The server has older messages than this window holds. */
  canLoadTailwards: boolean;
  /** This window holds the channel's newest message. */
  headLoaded: boolean;
  id: string;
  /** Shown in the message list. */
  isRead: boolean;
  /**
   * Not a loaded stretch: live messages waiting for the window they belong to, on the newer or the
   * older side of the loaded ones.
   */
  livePending?: 'newer' | 'older';
  messageIds: string[];
  raw: RawInterval;
  /** This window holds the channel's oldest message. */
  tailLoaded: boolean;
};

export type WindowsView = {
  /** Tail to head: the oldest window first, as the message list reads from the top. */
  windows: MessageWindow[];
  read?: MessageWindow;
  /** The window that holds the channel's newest message, if one is loaded. */
  head?: MessageWindow;
};

const LOGICAL_HEAD_ID = '__logical_head__';

export const lastOf = <T>(items: readonly T[] | undefined): T | undefined =>
  items?.[items.length - 1];

const toWindow = (raw: RawInterval, activeId: string | undefined): MessageWindow => ({
  canLoadHeadwards: !!raw.hasMoreHead,
  canLoadTailwards: !!raw.hasMoreTail,
  headLoaded: !!raw.isHead,
  id: raw.id,
  isRead: raw.id === activeId,
  livePending:
    raw.isHead === undefined
      ? raw.id === LOGICAL_HEAD_ID
        ? 'newer'
        : 'older'
      : undefined,
  messageIds: raw.itemIds,
  raw,
  tailLoaded: !!raw.isTail,
});

export const readWindows = (paginator: MessagePaginator): WindowsView => {
  const { _activeIntervalId, _itemIntervals } =
    paginator as unknown as PaginatorInternals;
  const newestCreatedAt = (window: MessageWindow) =>
    Number(paginator.getItem(lastOf(window.messageIds))?.created_at ?? 0);
  const windows = (_itemIntervals instanceof Map ? [..._itemIntervals.values()] : [])
    .map((raw) => toWindow(raw, _activeIntervalId))
    .sort((a, b) => newestCreatedAt(a) - newestCreatedAt(b));
  return {
    head: windows.find((window) => window.headLoaded),
    read: windows.find((window) => window.isRead),
    windows,
  };
};

/** e.g. "window being read · head window" */
export const windowName = (window: MessageWindow) => {
  if (window.livePending) {
    return `live messages waiting for their window (${window.livePending} side)`;
  }
  const names = [
    window.isRead && 'window being read',
    window.headLoaded && 'head window',
  ].filter(Boolean);
  return names.length ? names.join(' · ') : 'stored window';
};

/** `sim-011` as is; a long id (a real message's UUID) cut to its first 8 characters. */
export const shortId = (id: string | undefined) => {
  if (!id) return '—';
  return id.startsWith('sim-') || id.length <= 10 ? id : `${id.slice(0, 8)}…`;
};

/** e.g. "sim-001–sim-100" */
export const rangeOf = (messageIds: readonly string[] | undefined) =>
  messageIds?.length
    ? `${shortId(messageIds[0])}–${shortId(lastOf(messageIds))}`
    : 'nothing';

export const windowWith = (view: WindowsView, messageId: string | undefined) =>
  messageId === undefined
    ? undefined
    : view.windows.find((window) => window.messageIds.includes(messageId));

/** e.g. "sim-001–sim-100 (read) · sim-311–sim-410 (head)", tail to head, for the log. */
export const describeWindows = ({ windows }: WindowsView) =>
  windows.length
    ? windows
        .map((window) => {
          const marks = [window.isRead && 'read', window.headLoaded && 'head'].filter(
            Boolean,
          );
          return `${rangeOf(window.messageIds)}${marks.length ? ` (${marks.join(', ')})` : ''}`;
        })
        .join(' · ')
    : 'no windows';
