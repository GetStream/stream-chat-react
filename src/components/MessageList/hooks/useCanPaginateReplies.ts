import { useThreadContext } from '../../Threads';
import { useStateStore } from '../../../store';

import type { LocalMessage, ThreadState } from 'stream-chat';

const threadSelector = ({ replyCount }: ThreadState) => ({ replyCount });

const paginatorSelector = ({ items }: { items: LocalMessage[] | undefined }) => ({
  loadedCount: items?.length ?? 0,
});

/**
 * Whether the list this hook is rendered in has replies left to fetch by scrolling.
 *
 * Always `true` outside a thread — a channel list paginates regardless.
 *
 * It exists because of the shape of a short list: it sits within the scroll threshold of BOTH its
 * top and its bottom, so the infinite scroller asks for a page in each direction as soon as it
 * observes its own size. The reply paginator cannot refuse while it has never queried — "more
 * headward/tailward" is optimistically true then, which is right in general and wrong here. The
 * counts are the missing piece, and they live on the thread.
 *
 * Two rules, in order:
 *
 * - **Nothing loaded yet → no.** The first page is the thread's own job: `Thread.reload()` fetches
 *   it through `GET /threads/:id`, which hydrates participants, read state and a watch alongside
 *   the replies. Arming here would ask for the same page again through
 *   `GET /messages/:id/replies`. A thread with no replies at all is the same rule — there is
 *   nothing to load, and until the first reply the thread does not exist server-side.
 * - **Otherwise, only when the parent reports replies the list does not hold.** Which also covers
 *   the moment the first reply is sent: it is ingested locally and the count catches up, so there
 *   is nothing left to ask for.
 *
 * The count is the raw window length, so a message the server never acknowledged (a failed send,
 * say) counts toward it. That can only under-arm, and only for a window that is BOTH partially
 * loaded and padded with enough local-only messages to reach `reply_count` — narrow enough not to
 * pay for a per-emission scan of the list.
 *
 * Not sticky: `replyCount` projects the parent message's `reply_count`, which the server keeps
 * current over the WS, and `loadedCount` follows the paginator, so both re-evaluate on their own.
 */
export const useCanPaginateReplies = (): boolean => {
  const thread = useThreadContext();
  const { replyCount } = useStateStore(thread?.state, threadSelector) ?? {};
  const { loadedCount } = useStateStore(
    thread?.messagePaginator?.state,
    paginatorSelector,
  ) ?? { loadedCount: 0 };

  if (!thread) return true;
  if (loadedCount === 0) return false;
  return (replyCount ?? 0) > loadedCount;
};
