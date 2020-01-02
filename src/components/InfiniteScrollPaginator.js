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
    LoadingIndicator: <LoadingIndicator />,
  };

  render() {
    return (
      <InfiniteScroll
        loadMore={this.props.loadNextPage}
        hasMore={this.props.hasNextPage}
        isLoading={this.props.refreshing}
        isReverse={this.props.reverse}
        threshold={this.props.threshold}
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
