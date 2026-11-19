import type { PaginatorState } from 'stream-chat';

/**
 * The error a list shows in place of its items: the last query failed, no query runs and the list
 * has nothing to show. A list with items to show, loaded or from elsewhere, keeps showing them when
 * a query fails.
 */
export const getErrorShownInPlaceOfList = ({
  hasItemsToShow,
  isLoading,
  lastQueryError,
}: {
  hasItemsToShow: boolean;
  isLoading: boolean;
  lastQueryError: Error | undefined;
}) => (!hasItemsToShow && !isLoading ? lastQueryError : undefined);

/**
 * The error of a paginated list's failed first page: nothing is loaded, no query is running and
 * the last query failed. `undefined` otherwise, including while a retry runs.
 */
export const getFirstPageLoadError = <T>({
  isLoading,
  items,
  lastQueryError,
}: PaginatorState<T>): Error | undefined =>
  getErrorShownInPlaceOfList({
    hasItemsToShow: items !== undefined,
    isLoading,
    lastQueryError,
  });
