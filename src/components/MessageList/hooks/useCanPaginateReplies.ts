import { useThreadContext } from '../../Threads';
import { useStateStore } from '../../../store';

import type { ThreadState } from 'stream-chat';

const selector = ({ replyCount }: ThreadState) => ({ replyCount });

/**
 * Whether the list this hook is rendered in has replies worth paginating.
 *
 * Always `true` outside a thread — a channel list paginates regardless.
 *
 * Inside a thread it follows the parent message's reply count, and the reason is the shape of an
 * empty list: it sits within the scroll threshold of BOTH its top and its bottom, so the infinite
 * scroller's mount-time observation asks for a page in each direction. On a thread with no replies
 * those are requests for messages that cannot exist — and until the first reply the thread itself
 * does not exist server-side. The reply paginator can't tell: it has no loaded window, so "more
 * headward/tailward" is optimistically true, which is correct in general and wrong here. The count
 * is the missing piece, and it lives on the thread.
 *
 * Not sticky: `replyCount` projects the parent message's `reply_count`, which the server keeps
 * current over the WS, so pagination arms itself the moment a reply exists.
 */
export const useCanPaginateReplies = (): boolean => {
  const thread = useThreadContext();
  const { replyCount } = useStateStore(thread?.state, selector) ?? {};

  if (!thread) return true;
  return (replyCount ?? 0) > 0;
};
