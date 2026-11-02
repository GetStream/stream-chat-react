import { useEffect, useState } from 'react';
import { UserSearchSource } from 'stream-chat';
import type { SearchSourceState, UserResponse } from 'stream-chat';
import { useChatContext, useStateStore } from 'stream-chat-react';

const resultsSelector = ({
  isLoading,
  items,
  lastQueryError,
}: SearchSourceState<UserResponse>) => ({ isLoading, items, lastQueryError });

/**
 * People to start a conversation with, by name or id, sorted by name. An empty text lists everyone,
 * so the dialog has suggestions before the user types. The user isn't among the results.
 */
export const usePeopleSearch = (text: string) => {
  const { client } = useChatContext();
  const [source] = useState(
    () =>
      new UserSearchSource(client, {
        allowEmptySearchString: true,
        pageSize: 10,
        sort: [{ direction: 1, field: 'name' }],
      }),
  );
  const { isLoading, items, lastQueryError } = useStateStore(
    source.state,
    resultsSelector,
  );

  useEffect(() => {
    source.activate();
    // Waits for a pause in typing, and cancels the query of the text before.
    void source.search(text.trim());
  }, [source, text]);

  // Drops the scheduled query and the one in flight when the dialog closes.
  useEffect(
    () => () => {
      source.cancelScheduledQuery();
      source.resetState();
    },
    [source],
  );

  return { failed: !!lastQueryError, isLoading, people: items ?? [] };
};
