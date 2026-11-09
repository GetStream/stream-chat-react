import { useThreadContext } from '../../Threads';
import { useStateStore } from '../../../store';

import type { LocalMessage, ThreadState } from 'stream-chat';

const threadSelector = ({ replyCount }: ThreadState) => ({ replyCount });

const paginatorSelector = ({ items }: { items: LocalMessage[] | undefined }) => ({
  loadedCount: items?.length ?? 0,
});

/**
 * Whether the list this hook is rendered in has replies left to fetch by scrolling. Always `true`
 * outside a thread.
 *
 * A short list is within the scroll threshold of both its top and bottom, and the reply paginator
 * allows more pages optimistically until it has queried, so the thread's counts decide instead.
 * Nothing loaded yet means no: the first page belongs to `Thread.reload()` (`GET /threads/:id`),
 * and a thread with no replies has nothing to load. Otherwise it is true only when the thread's
 * `replyCount` exceeds the loaded count. The loaded count is the raw window length, so local-only
 * messages (e.g. a failed send) can only make it return `false` while replies remain.
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
