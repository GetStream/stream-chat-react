import React from 'react';
import PropTypes from 'prop-types';

import InfiniteScroll from './InfiniteScroll';
import { LoadingIndicator } from './LoadingIndicator';

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
  };

  render() {
    console.log(this.props);
    return (
      <InfiniteScroll
        loadMore={this.props.loadNextPage}
        hasMore={this.props.hasNextPage}
        isLoading={this.props.refreshing}
        isReverse={this.props.reverse}
        loading={<LoadingIndicator />}
      >
        {this.props.children}
      </InfiniteScroll>
    );
  }
}
