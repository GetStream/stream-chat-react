import React from 'react';

import {
  LoadMoreButton as DefaultLoadMoreButton,
  LoadMoreButtonProps,
} from './LoadMoreButton';

import { smartRender } from '../../utils';

export type LoadMorePaginatorProps = {
  /** callback to load the next page */
  loadNextPage: () => void;
  hasNextPage?: boolean;
  LoadMoreButton?: React.ComponentType<LoadMoreButtonProps>;
  /** indicates if there there's currently any refreshing taking place */
  refreshing?: boolean;
  reverse?: boolean;
};

export const UnMemoizedLoadMorePaginator: React.FC<LoadMorePaginatorProps> = (
  props,
) => {
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
      {hasNextPage &&
        smartRender(LoadMoreButton, { onClick: loadNextPage, refreshing })}
      {reverse && children}
    </>
  );
};

export const LoadMorePaginator = React.memo(
  UnMemoizedLoadMorePaginator,
) as typeof UnMemoizedLoadMorePaginator;
