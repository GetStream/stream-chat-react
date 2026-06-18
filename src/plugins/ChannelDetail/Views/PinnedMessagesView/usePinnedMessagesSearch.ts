import {
  type LocalMessage,
  type MessageResponse,
  MessageSearchSource,
  type SearchSourceState,
} from 'stream-chat';
import { useCallback, useEffect, useMemo } from 'react';

import { useChatContext } from '../../../../context';
import { useStateStore } from '../../../../store';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { usePinnedMessagesCount } from './usePinnedMessagesCount';

const PINNED_MESSAGES_SEARCH_PAGE_SIZE = 30;
const PINNED_MESSAGES_SEARCH_DEBOUNCE_MS = 300;

const pinnedMessagesSearchSourceItemsStateSelector = (
  state: SearchSourceState<MessageResponse>,
) => ({
  messages: state.items,
});

export type UsePinnedMessagesSearchParams = {
  /**
   * Custom message search source for pinned messages. When provided it is used
   * as-is — its filters and sort are respected, never overridden.
   */
  searchSource?: MessageSearchSource;
};

export const usePinnedMessagesSearch = ({
  searchSource,
}: UsePinnedMessagesSearchParams = {}) => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();
  const pinnedMessagesSearchSource = useMemo(() => {
    const source =
      searchSource ??
      new MessageSearchSource(
        client,
        {
          allowEmptySearchString: true,
          debounceMs: PINNED_MESSAGES_SEARCH_DEBOUNCE_MS,
          pageSize: PINNED_MESSAGES_SEARCH_PAGE_SIZE,
          resetOnNewSearchQuery: false,
        },
        {
          messageSearch: {
            initialFilterConfig: {
              text: {
                enabled: true,
                generate: ({ searchQuery }) =>
                  searchQuery
                    ? {
                        text: { $autocomplete: searchQuery },
                      }
                    : null,
              },
            },
          },
        },
      );

    // Only configure a source we own; a provided source keeps its own filters
    // and sort.
    if (!searchSource) {
      source.messageSearchChannelFilters = { cid: channel.cid };
      source.messageSearchFilters = { pinned: true };
    }
    source.activate();

    return source;
  }, [channel.cid, client, searchSource]);

  const { messages } = useStateStore(
    pinnedMessagesSearchSource.state,
    pinnedMessagesSearchSourceItemsStateSelector,
  );

  // Query-independent flag, reactive to pin/unpin. The search source is the sole
  // source of the displayed list, but it does not know whether the channel has
  // pinned messages until a query resolves; this gates the search input, the
  // initial load and the empty-state choice (the channel can have pinned messages
  // that the current query matches none of).
  const hasPinnedMessages = usePinnedMessagesCount(channel) > 0;

  // The list is loaded and paginated entirely by the search source. Load the
  // first page once the channel is known to have pinned messages — gating on
  // hasPinnedMessages also loads page one when the channel gains its first pin
  // during the session.
  useEffect(() => {
    if (!hasPinnedMessages) return;
    void pinnedMessagesSearchSource.search('');
  }, [hasPinnedMessages, pinnedMessagesSearchSource]);

  const handleSearchChange = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        // Clearing the query reloads the full pinned list from its first page.
        pinnedMessagesSearchSource.cancelScheduledQuery();
        pinnedMessagesSearchSource.resetState();
        pinnedMessagesSearchSource.activate();
        void pinnedMessagesSearchSource.search('');
        return;
      }

      pinnedMessagesSearchSource.search(trimmedQuery);
    },
    [pinnedMessagesSearchSource],
  );

  useEffect(
    () => () => {
      pinnedMessagesSearchSource.cancelScheduledQuery();
    },
    [pinnedMessagesSearchSource],
  );

  return {
    displayedMessages: (messages ?? []) as Array<MessageResponse | LocalMessage>,
    handleSearchChange,
    hasPinnedMessages,
    hasSearchResultsLoaded: Array.isArray(messages),
    pinnedMessagesSearchSource,
  };
};
