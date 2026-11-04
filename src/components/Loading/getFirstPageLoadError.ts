import type { PaginatorState } from 'stream-chat';

/**
 * The error of a paginated list's failed first page: nothing is loaded, no query is running and
 * the last query failed. `undefined` otherwise, including while a retry runs.
 */
export const getFirstPageLoadError = <T>({
  isLoading,
  items,
  lastQueryError,
}: PaginatorState<T>): Error | undefined =>
  items === undefined && !isLoading ? lastQueryError : undefined;
