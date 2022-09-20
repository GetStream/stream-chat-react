import React, { PropsWithChildren } from 'react';

import { LoadMoreButton as DefaultLoadMoreButton, LoadMoreButtonProps } from './LoadMoreButton';

export type LoadMorePaginatorProps = {
  /** callback to load the next page */
  loadNextPage: () => void;
  /** Boolean for if there is a next page to load */
  hasNextPage?: boolean;
  /** A UI button component that handles pagination logic */
  LoadMoreButton?: React.ComponentType<LoadMoreButtonProps>;
  /** indicates if there's currently any refreshing taking place */
  refreshing?: boolean;
  /** indicates if the `LoadMoreButton` should be displayed at the top of the list of channels instead of the bottom of the list (the default) */
  reverse?: boolean;
};

export const UnMemoizedLoadMorePaginator = (props: PropsWithChildren<LoadMorePaginatorProps>) => {
  const {
    children,
    hasNextPage,
    LoadMoreButton = DefaultLoadMoreButton,
    loadNextPage,
    refreshing,
    reverse,
  } = props;

  return (
    <>
      {!reverse && children}
      {hasNextPage && <LoadMoreButton onClick={loadNextPage} refreshing={refreshing} />}
      {reverse && children}
    </>
  );
};

export const LoadMorePaginator = React.memo(
  UnMemoizedLoadMorePaginator,
) as typeof UnMemoizedLoadMorePaginator;
