import React from 'react';
import PropTypes from 'prop-types';
import { LoadingIndicator } from 'react-file-utils';

export class LoadMoreButton extends React.PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
  };

  static defaultProps = {
    children: 'Load more',
  };

  render() {
    return (
      <div className="str-chat__load-more-button">
        <button
          className="str-chat__load-more-button__button"
          onClick={this.props.onClick}
          disabled={this.props.refreshing}
        >
          {this.props.refreshing ? <LoadingIndicator /> : this.props.children}
        </button>
      </div>
    );
  }
}
