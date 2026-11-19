import { useMemo } from 'react';
import type { PollVoteResponseData } from 'stream-chat';

import type {
  CursorPaginatorState,
  CursorPaginatorStateStore,
} from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { useFirstPageLoadRetry } from '../../ListStates/hooks';
import { getErrorShownInPlaceOfList } from '../../ListStates/utils';
import { useStateStore } from '../../../store';

const queryStateSelector = ({
  error,
  items,
  loading,
}: CursorPaginatorState<PollVoteResponseData>) => ({
  error,
  hasLoadedItems: items.length > 0,
  loading,
});

export type UsePollVotesFirstPageLoadRetryParams = {
  /** The state of the list's `useCursorPaginator`. */
  cursorPaginatorState: CursorPaginatorStateStore<PollVoteResponseData>;
  /** Announced when a retry loads the first page. */
  loadedMessage: string;
  /** Loads the next page; with no page loaded yet, the first one. */
  loadMore: () => Promise<void>;
};

/**
 * Retries the failed first page of a poll's vote or comment list. A list with loaded votes keeps
 * them when a further page fails, so only a list with none shows the error. Votes that arrive in
 * realtime do not count as a loaded page.
 *
 * @returns `error`, the error to show in place of the list, `isRetrying`, and `retry`, which
 *   queries the first page again.
 */
export const usePollVotesFirstPageLoadRetry = ({
  cursorPaginatorState,
  loadedMessage,
  loadMore,
}: UsePollVotesFirstPageLoadRetryParams) => {
  const { error, hasLoadedItems, loading } = useStateStore(
    cursorPaginatorState,
    queryStateSelector,
  );
  // The retry reads the query state when it settles, so it reads the store, not this render. The
  // paginator names its fields `loading` and `error`; the retry reads `isLoading` and
  // `lastQueryError`.
  const retriedPaginator = useMemo(
    () => ({
      get isLoading() {
        return cursorPaginatorState.getLatestValue().loading;
      },
      get lastQueryError() {
        return cursorPaginatorState.getLatestValue().error;
      },
    }),
    [cursorPaginatorState],
  );

  return useFirstPageLoadRetry({
    firstPageLoadError: getErrorShownInPlaceOfList({
      hasItemsToShow: hasLoadedItems,
      isLoading: loading,
      lastQueryError: error,
    }),
    loadedMessage,
    paginator: retriedPaginator,
    reload: loadMore,
  });
};
