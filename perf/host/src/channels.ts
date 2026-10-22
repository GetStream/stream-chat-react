import type { ChannelPaginator, StreamChat } from 'stream-chat';

// Channel-list and read state the runner needs around live runs, read from the SDK rather than the
// DOM (WEB-PLAN.md §6.6):
//   - which rows left and joined the channel list during a window, for the `rows-changed` gate
//     (CL-08, CL-09: rows must actually disappear and come back, or a smooth number means nothing);
//   - how many other members have read the newest own message, for ML-12's receipt check.

let paginator: ChannelPaginator | undefined;
let client: StreamChat | undefined;
export const setChannelState = (c: StreamChat, p: ChannelPaginator) => {
  client = c;
  paginator = p;
};

const cidsNow = () =>
  new Set((paginator?.state.getLatestValue().items ?? []).map((channel) => channel.cid));

export type RowChanges = {
  added: number;
  removed: number;
  addedCids: string[];
  removedCids: string[];
};
let rows: { previous: Set<string>; added: string[]; removed: string[] } | null = null;
let stopRows: (() => void) | undefined;

/** Starts recording every row that leaves or joins the list. Passive: a store subscription. */
export const watchRows = () => {
  stopRows?.();
  rows = { added: [], previous: cidsNow(), removed: [] };
  stopRows = paginator?.state.subscribe(() => {
    if (!rows) return;
    const now = cidsNow();
    for (const cid of now) if (!rows.previous.has(cid)) rows.added.push(cid);
    for (const cid of rows.previous) if (!now.has(cid)) rows.removed.push(cid);
    rows.previous = now;
  });
};

export const stopWatchingRows = (): RowChanges => {
  stopRows?.();
  stopRows = undefined;
  const { added = [], removed = [] } = rows ?? {};
  rows = null;
  return {
    added: added.length,
    addedCids: added,
    removed: removed.length,
    removedCids: removed,
  };
};

// v10 keeps timestamps as Unix nanoseconds (`TimestampNS`); accept an RFC 3339 string as well.
const toMs = (t: unknown) =>
  typeof t === 'string' && t.includes('T') ? Date.parse(t) : Number(t) / 1e6;

/** Other members whose last read is at or after the newest message the current user sent. */
export const readersOfNewestOwn = (cid: string) => {
  const channel = client?.channelManager.get(cid);
  const me = client?.userID;
  if (!channel || !me) throw new Error(`${cid} is not loaded`);
  const items = (channel.messagePaginator.state.getLatestValue().items ??
    []) as unknown as Array<{
    user?: { id?: string };
    created_at?: unknown;
  }>;
  const newest = items.filter((m) => m.user?.id === me).at(-1);
  if (newest?.created_at == null) return { readers: 0, sentAt: null };
  const sentAt = toMs(newest.created_at);
  const read = channel.state.read as Record<string, { last_read: unknown }>;
  const readers = Object.entries(read).filter(
    ([userId, r]) => userId !== me && toMs(r.last_read) >= sentAt,
  ).length;
  return { readers, sentAt };
};
