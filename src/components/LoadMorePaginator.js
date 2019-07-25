import * as React from 'react';
import { LoadMoreButton } from './LoadMoreButton';
import PropTypes from 'prop-types';
import { smartRender } from '../utils';

export class LoadMorePaginator extends React.PureComponent {
  static propTypes = {
    LoadMoreButton: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** callback to load the next page */
    loadNextPage: PropTypes.func,
    /** indicates if there is a next page to load */
    hasNextPage: PropTypes.bool,
    /** display the items in opposite order */
    reverse: PropTypes.bool,
  };
  static defaultProps = {
    LoadMoreButton,
  };
  render() {
    return (
      <React.Fragment>
        {!this.props.reverse && this.props.children}
        {this.props.hasNextPage
          ? smartRender(this.props.LoadMoreButton, {
              refreshing: this.props.refreshing,
              onClick: this.props.loadNextPage,
            })
          : null}
        {this.props.reverse && this.props.children}
      </React.Fragment>
    );
  }
}
