import type { PropsWithChildren } from 'react';
import React, { useEffect } from 'react';

import type { LoadMoreButtonProps } from './LoadMoreButton';
import { LoadMoreButton as DefaultLoadMoreButton } from './LoadMoreButton';
import type { PaginatorProps } from '../../types/types';
import { deprecationAndReplacementWarning } from '../../utils/deprecationWarning';

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
    refreshing,
    reverse,
  } = props;
  const loadingState = typeof isLoading !== 'undefined' ? isLoading : refreshing;

  useEffect(() => {
    deprecationAndReplacementWarning(
      [[{ refreshing }, { isLoading }]],
      'LoadMorePaginator',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!reverse && children}
      {hasNextPage && <LoadMoreButton isLoading={loadingState} onClick={loadNextPage} />}
      {reverse && children}
    </>
  );
};

export const LoadMorePaginator = React.memo(
  UnMemoizedLoadMorePaginator,
) as typeof UnMemoizedLoadMorePaginator;
