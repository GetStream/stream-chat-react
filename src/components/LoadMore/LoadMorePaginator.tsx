import type { PropsWithChildren } from 'react';
import React from 'react';

import type { LoadMoreButtonProps } from './LoadMoreButton';
import { LoadMoreButton as DefaultLoadMoreButton } from './LoadMoreButton';
import type { PaginatorProps } from '../../types/types';

export type LoadMorePaginatorProps = PaginatorProps & {
  /** A UI button component that handles pagination logic */
  LoadMoreButton?: React.ComponentType<LoadMoreButtonProps>;
  /** indicates if the `LoadMoreButton` should be displayed at the top of the list of channels instead of the bottom of the list (the default) */
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
