import React from 'react';
import PropTypes from 'prop-types';
import { LoadingIndicator } from 'react-file-utils';

import InfiniteScroll from './InfiniteScroll';

export class InfiniteScrollPaginator extends React.Component {
  static propTypes = {
    /** callback to load the next page */
    loadNextPage: PropTypes.func,
    /** indicates if there is a next page to load */
    hasNextPage: PropTypes.bool,
    /** indicates if there there's currently any refreshing taking place */
    refreshing: PropTypes.bool,
    /** display the items in opposite order */
    reverse: PropTypes.bool,
    /** Offset from when to start the loadNextPage call */
    threshold: PropTypes.number,
    /** The loading indicator to use */
    LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  };

  static defaultProps = {
    LoadingIndicator,
  };

  render() {
    const {
      LoadingIndicator,
      loadNextPage,
      hasNextPage,
      refreshing,
      reverse,
      threshold,
    } = this.props;

    return (
      <InfiniteScroll
        loadMore={loadNextPage}
        hasMore={hasNextPage}
        isLoading={refreshing}
        isReverse={reverse}
        threshold={threshold}
        useWindow={false}
        loader={
          <div
            className="str-chat__infinite-scroll-paginator"
            key="loadingindicator"
          >
            <LoadingIndicator />
          </div>
        }
      >
        {this.props.children}
      </InfiniteScroll>
    );
  }
}
