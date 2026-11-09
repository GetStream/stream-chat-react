import type { PropsWithChildren } from 'react';
import React from 'react';

import type { LoadMoreButtonProps } from './LoadMoreButton';
import { LoadMoreButton as DefaultLoadMoreButton } from './LoadMoreButton';
import type { PaginatorProps } from '../../types/types';

export type LoadMorePaginatorProps = PaginatorProps & {
  /** Replaces the default button. Receives `isLoading` and `onClick` set to `loadNextPage`. */
  LoadMoreButton?: React.ComponentType<LoadMoreButtonProps>;
  /** Places the button above `children` instead of below. */
  reverse?: boolean;
};

export const UnMemoizedLoadMorePaginator = (
  props: PropsWithChildren<LoadMorePaginatorProps>,
) => {
  const {
    children,
    hasNextPage,
    isLoading,
    LoadMoreButton = DefaultLoadMoreButton,
    loadNextPage,
    reverse,
  } = props;

  return (
    <>
      {!reverse && children}
      {hasNextPage && <LoadMoreButton isLoading={isLoading} onClick={loadNextPage} />}
      {reverse && children}
    </>
  );
};

export const LoadMorePaginator = React.memo(
  UnMemoizedLoadMorePaginator,
) as typeof UnMemoizedLoadMorePaginator;
