import type { Channel, LocalMessage, PaginatorState } from 'stream-chat';

import { useStateStore } from '../../../../store';

const selector = (state: PaginatorState<LocalMessage>) => ({
  count: state.items?.length ?? 0,
});

/**
 * Reactive count of the loaded pinned messages in `channel.pinnedMessagesPaginator`, which the
 * SDK's channel event handlers keep current.
 */
export const usePinnedMessagesCount = (channel: Channel) => {
  const { count } = useStateStore(channel.pinnedMessagesPaginator.state, selector);
  return count;
};
