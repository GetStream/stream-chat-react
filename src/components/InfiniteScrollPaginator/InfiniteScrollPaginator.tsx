import React from 'react';
import { LoadingIndicator as DefaultLoadingIndicator } from 'react-file-utils';

import { InfiniteScroll } from './InfiniteScroll';

import type { LoadingIndicatorProps } from '../Loading/LoadingIndicator';

export type InfiniteScrollPaginatorProps = {
  /** callback to load the next page */
  loadNextPage: () => void;
  /** indicates if there is a next page to load */
  hasNextPage?: boolean;
  /** The loading indicator to use */
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  /** indicates if there there's currently any refreshing taking place */
  refreshing?: boolean;
  /** display the items in opposite order */
  reverse?: boolean;
  /** Offset from when to start the loadNextPage call */
  threshold?: number;
};

export const InfiniteScrollPaginator: React.FC<InfiniteScrollPaginatorProps> = (props) => {
  const {
    children,
    hasNextPage,
    LoadingIndicator = DefaultLoadingIndicator,
    loadNextPage,
    refreshing,
    reverse,
    threshold,
  } = props;

  return (
    <InfiniteScroll
      hasMore={hasNextPage}
      isLoading={refreshing}
      isReverse={reverse}
      loader={
        <div className='str-chat__infinite-scroll-paginator' key='loadingindicator'>
          <LoadingIndicator />
        </div>
      }
      loadMore={loadNextPage}
      threshold={threshold}
      useWindow={false}
    >
      {children}
    </InfiniteScroll>
  );
};
