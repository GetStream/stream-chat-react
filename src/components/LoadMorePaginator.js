import * as React from 'react';
import { LoadMoreButton } from './LoadMoreButton';
import PropTypes from 'prop-types';
import { smartRender } from '../utils';

export class LoadMorePaginator extends React.Component {
  static propTypes = {
    LoadMoreButton: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  };
  static defaultProps = {
    LoadMoreButton,
  };
  render() {
    console.log(this.props.LoadMoreButton);
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
