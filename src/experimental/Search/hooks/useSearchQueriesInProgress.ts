import {
  DefaultSearchSources,
  SearchController,
  SearchControllerState,
  SearchSource,
} from '../SearchController';
import { useEffect, useState } from 'react';
import type { DefaultStreamChatGenerics } from '../../../types';
import { useStateStore } from '../../../store';

const searchControllerStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>(
  value: SearchControllerState<StreamChatGenerics, Sources>,
) => ({
  sources: value.sources,
});

export type UseSearchQueriesInProgressParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  searchController: SearchController<StreamChatGenerics, Sources>;
};

export const useSearchQueriesInProgress = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>(
  searchController: SearchController<StreamChatGenerics, Sources>,
) => {
  const [queriesInProgress, setQueriesInProgress] = useState<string[]>([]);
  const { sources } = useStateStore(searchController.state, searchControllerStateSelector);

  useEffect(() => {
    const subscriptions = sources.map((source) =>
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
