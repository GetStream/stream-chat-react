import React from 'react';
import PropTypes from 'prop-types';

export class LoadMoreButton extends React.PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
  };

  static defaultProps = {
    children: 'Load more',
  };

  render() {
    return (
      <button
        onClick={this.props.onClick}
        disabled={this.props.refreshing}
        loading={this.props.refreshing}
      >
        {this.props.children}
      </button>
    );
  }
}
