import uniqBy from 'lodash.uniqby';
import { useCallback, useEffect, useMemo } from 'react';
import { StateStore } from 'stream-chat';

export type CursorPaginatorState<T> = {
  hasNextPage: boolean;
  items: T[];
  latestPageItems: T[];
  loading: boolean;
  error?: Error;
  next?: string | null;
};

export type CursorPaginatorStateStore<T> = StateStore<CursorPaginatorState<T>>;

export type PaginationFn<T> = (next?: string) => Promise<{ items: T[]; next?: string }>;

export const useCursorPaginator = <T>(
  paginationFn: PaginationFn<T>,
  loadFirstPage?: boolean,
) => {
  const cursorPaginatorState = useMemo(
    () =>
      new StateStore<CursorPaginatorState<T>>({
        hasNextPage: true,
        items: [],
        latestPageItems: [],
        loading: false,
      }),
    [],
  );

  const loadMore = useCallback(async () => {
    const { loading, next: currentNext } = cursorPaginatorState.getLatestValue();
    if (currentNext === null || loading) return;

    cursorPaginatorState.partialNext({ loading: true });

    try {
      const { items, next } = await paginationFn(currentNext);
      cursorPaginatorState.next((prev) => ({
        ...prev,
        hasNextPage: !!next,
        items: uniqBy(prev.items.concat(items), 'id'),
        latestPageItems: items,
        next: next || null,
      }));
    } catch (error) {
      cursorPaginatorState.partialNext({ error: error as Error });
    }
    cursorPaginatorState.partialNext({ loading: false });
  }, [cursorPaginatorState, paginationFn]);

  useEffect(() => {
    const { items } = cursorPaginatorState.getLatestValue();
    if (!loadFirstPage || items.length) return;
    loadMore();
  }, [cursorPaginatorState, loadFirstPage, loadMore]);

  return {
    cursorPaginatorState,
    loadMore,
  };
};
