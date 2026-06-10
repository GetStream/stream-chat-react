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

const PINNED_MESSAGES_SEARCH_PAGE_SIZE = 30;
const PINNED_MESSAGES_SEARCH_DEBOUNCE_MS = 300;

const pinnedMessagesSearchSourceItemsStateSelector = (
  state: SearchSourceState<MessageResponse>,
) => ({
  messages: state.items,
});

export const usePinnedMessagesSearch = () => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();
  const fallbackPinnedMessages = useMemo(
    // sort descending by creation date
    () =>
      channel.state?.pinnedMessages?.sort(
        (a, b) => b.created_at.getTime() - a.created_at.getTime(),
      ) ?? [],
    [channel],
  );
  const pinnedMessagesSearchSource = useMemo(() => {
    const source = new MessageSearchSource(
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

    source.messageSearchChannelFilters = { cid: channel.cid };
    source.messageSearchFilters = { pinned: true };
    source.activate();

    return source;
  }, [channel.cid, client]);
  const { messages } = useStateStore(
    pinnedMessagesSearchSource.state,
    pinnedMessagesSearchSourceItemsStateSelector,
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        pinnedMessagesSearchSource.cancelScheduledQuery();
        pinnedMessagesSearchSource.resetState();
        pinnedMessagesSearchSource.activate();
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
    displayedMessages: (messages ?? fallbackPinnedMessages) as Array<
      MessageResponse | LocalMessage
    >,
    handleSearchChange,
    hasSearchResultsLoaded: Array.isArray(messages),
    pinnedMessagesSearchSource,
  };
};
