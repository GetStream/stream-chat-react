import { useCallback } from 'react';
import type { SearchSource, SearchSourceState } from 'stream-chat';

import { useFirstPageLoadRetry } from '../../ListStates/hooks';
import { getErrorShownInPlaceOfList } from '../../ListStates/utils';
import { useStateStore } from '../../../store';

/** A search source that runs a query at once, without the debounce of `search()`. */
type SearchSourceWithImmediateQuery = SearchSource & {
  executeQuery: (searchQuery?: string) => Promise<void> | void;
};

/** The SDK's search sources run a query at once; a source implementing only `SearchSource` may not. */
const runsQueriesAtOnce = (
  searchSource: SearchSource,
): searchSource is SearchSourceWithImmediateQuery =>
  typeof (searchSource as Partial<SearchSourceWithImmediateQuery>).executeQuery ===
  'function';

const searchSourceQueryStateSelector = ({
  isLoading,
  items,
  lastQueryError,
}: SearchSourceState) => ({ hasItems: !!items?.length, isLoading, lastQueryError });

/**
 * Retries a search source whose first page of results failed to load. The search results announce
 * their count once the retry loads them.
 *
 * @returns `error`, the error to show in place of the results, `isRetrying`, and `retry`, which
 *   runs the search query that failed again.
 */
export const useSearchSourceFirstPageLoadRetry = (searchSource: SearchSource) => {
  const { hasItems, isLoading, lastQueryError } = useStateStore(
    searchSource.state,
    searchSourceQueryStateSelector,
  );
  // Runs the failed query again, as a new search query: the source shows as loading with no
  // results until it settles, and stays active, so its results stay mounted meanwhile. A newer
  // query typed within its debounce runs after the retry and replaces it. A source that only
  // debounces its queries settles the retry at once and loads after the debounce.
  const reload = useCallback(() => {
    const { searchQuery } = searchSource;
    return Promise.resolve(
      runsQueriesAtOnce(searchSource)
        ? searchSource.executeQuery(searchQuery)
        : searchSource.search(searchQuery),
    );
  }, [searchSource]);

  return useFirstPageLoadRetry({
    firstPageLoadError: getErrorShownInPlaceOfList({
      hasItemsToShow: hasItems,
      isLoading,
      lastQueryError,
    }),
    paginator: searchSource,
    reload,
  });
};
