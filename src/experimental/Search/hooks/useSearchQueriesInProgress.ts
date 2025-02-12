import { useEffect, useState } from 'react';

import { useStateStore } from '../../../store';

import type { SearchController, SearchControllerState, SearchSource } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchControllerStateSelector = (value: SearchControllerState) => ({
  sources: value.sources,
});

export type UseSearchQueriesInProgressParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  searchController: SearchController<StreamChatGenerics>;
};

export const useSearchQueriesInProgress = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  searchController: SearchController<StreamChatGenerics>,
) => {
  const [queriesInProgress, setQueriesInProgress] = useState<string[]>([]);
  const { sources } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  useEffect(() => {
    const subscriptions = sources.map((source: SearchSource) =>
      source.state.subscribeWithSelector(
        (value) => ({ isLoading: value.isLoading }),
        ({ isLoading }) => {
          setQueriesInProgress((prev) => {
            if (isLoading) return prev.concat(source.type);
            return prev.filter((type) => type !== source.type);
          });
        },
      ),
    );

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [sources]);
  return queriesInProgress;
};
