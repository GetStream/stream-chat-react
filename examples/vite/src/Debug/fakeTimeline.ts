import type { MessagePaginationParams, MessageResponse, UserResponse } from 'stream-chat';
import { msToNs } from 'stream-chat';

/**
 * The fake server's message timeline: fabricated messages and the page a channel query gets from
 * them. Pure functions, so the paging rules can be read (and tested) apart from the SDK.
 *
 * Ids are `sim-001`, `sim-002`, … in sending order. Cursors are compared by that sequence number,
 * so a cursor whose message was hard-deleted still pages from where it was, as on the server.
 */

/** Page size of a channel query that sends no `limit`. */
export const DEFAULT_QUERY_LIMIT = 100;

export const SIMULATED_USER: UserResponse = {
  id: 'pagination-simulator',
  name: 'Pagination simulator',
} as UserResponse;

const ID_PREFIX = 'sim-';

export const simulatedMessageId = (sequence: number) =>
  `${ID_PREFIX}${String(sequence).padStart(3, '0')}`;

/** The sequence number of a simulated message id; `undefined` for any other id. */
export const sequenceOf = (id: string): number | undefined => {
  if (!id.startsWith(ID_PREFIX)) return undefined;
  const sequence = Number(id.slice(ID_PREFIX.length));
  return Number.isInteger(sequence) ? sequence : undefined;
};

/** A message as the server would return it. */
export const fabricateMessage = ({
  cid,
  createdAtMs,
  id,
  text,
  user = SIMULATED_USER,
}: {
  cid: string;
  createdAtMs: number;
  id: string;
  text: string;
  user?: UserResponse;
}): MessageResponse => {
  const createdAt = msToNs(createdAtMs);
  return {
    attachments: [],
    cid,
    created_at: createdAt,
    custom: {},
    deleted_reply_count: 0,
    html: `<p>${text}</p>\n`,
    id,
    latest_reactions: [],
    mentioned_channel: false,
    mentioned_here: false,
    mentioned_users: [],
    own_reactions: [],
    pinned: false,
    reaction_counts: {},
    reaction_scores: {},
    reply_count: 0,
    restricted_visibility: [],
    shadowed: false,
    silent: false,
    text,
    type: 'regular',
    updated_at: createdAt,
    user,
  } as MessageResponse;
};

/**
 * `limit` messages split evenly around a point, the rest taken from the other side when one side
 * runs out (the server's rule for `id_around` / `created_at_around`). `pivot` is the index of the
 * first message at or after the point; `includesPivot` counts that message as the point itself.
 */
const pageAround = (
  timeline: MessageResponse[],
  pivot: number,
  includesPivot: boolean,
  limit: number,
) => {
  const newerStart = includesPivot ? pivot + 1 : pivot;
  const slots = includesPivot ? limit - 1 : limit;
  let older = Math.min(pivot, Math.floor(slots / 2));
  const newer = Math.min(timeline.length - newerStart, slots - older);
  older = Math.min(pivot, slots - newer);
  return timeline.slice(pivot - older, newerStart + newer);
};

/** Index of the first message whose sequence is at or after `id`'s; `undefined` for a foreign id. */
const pivotOfId = (timeline: MessageResponse[], id: string) => {
  const target = sequenceOf(id);
  if (target === undefined) return undefined;
  const index = timeline.findIndex((message) => (sequenceOf(message.id) ?? 0) >= target);
  return index === -1 ? timeline.length : index;
};

/** `created_at_around` is a request field: a `Date`, an ISO string, or nanoseconds. */
const toNs = (value: Date | string | number) =>
  typeof value === 'number' ? value : msToNs(new Date(value).getTime());

/**
 * The page a channel query with these `messages` options returns, oldest first:
 * - `id_around` / `created_at_around`: around that message / time;
 * - `id_lt`: the `limit` messages just older than the cursor; `id_gt`: just newer;
 * - no cursor: the newest `limit` messages.
 * A cursor that is not a simulated id matches nothing.
 */
export const selectPage = (
  timeline: MessageResponse[],
  params: MessagePaginationParams = {},
): MessageResponse[] => {
  const limit = params.limit ?? DEFAULT_QUERY_LIMIT;
  if (limit <= 0) return [];

  if (params.id_around) {
    const pivot = pivotOfId(timeline, params.id_around);
    if (pivot === undefined) return [];
    const includesPivot = timeline[pivot]?.id === params.id_around;
    return pageAround(timeline, pivot, includesPivot, limit);
  }

  if (params.created_at_around) {
    const around = toNs(params.created_at_around as Date | string | number);
    const pivot = timeline.findIndex((message) => message.created_at >= around);
    return pageAround(timeline, pivot === -1 ? timeline.length : pivot, false, limit);
  }

  if (params.id_lt) {
    const pivot = pivotOfId(timeline, params.id_lt);
    return pivot === undefined ? [] : timeline.slice(Math.max(0, pivot - limit), pivot);
  }

  if (params.id_gt) {
    const cursor = sequenceOf(params.id_gt);
    if (cursor === undefined) return [];
    return timeline
      .filter((message) => (sequenceOf(message.id) ?? 0) > cursor)
      .slice(0, limit);
  }

  return timeline.slice(-limit);
};
