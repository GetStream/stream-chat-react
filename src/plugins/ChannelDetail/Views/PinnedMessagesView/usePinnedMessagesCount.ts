import type { Channel, LocalMessage, PaginatorState } from 'stream-chat';

import { useStateStore } from '../../../../store';

const selector = (state: PaginatorState<LocalMessage>) => ({
  count: state.items?.length ?? 0,
});

/**
 * Reactive count of the channel's loaded pinned messages, sourced from
 * `channel.pinnedMessagesPaginator`. The paginator is kept current by the SDK's channel event
 * handlers (pin/unpin/delete/truncate); `useStateStore` re-renders on every change.
 */
export const usePinnedMessagesCount = (channel: Channel) => {
  const { count } = useStateStore(channel.pinnedMessagesPaginator.state, selector);
  return count;
};
