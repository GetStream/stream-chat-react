import React from 'react';
import PropTypes from 'prop-types';

import svg from '../assets/str-chat__loading-indicator.svg';

/**
 * LoadingIndicator - Just a simple loading spinner..
 *
 * @example ./docs/LoadingIndicator.md
 * @extends PureComponent
 */
export class LoadingIndicator extends React.PureComponent {
  static propTypes = {
    /** The size of the loading icon */
    size: PropTypes.number,
  };
  static defaultProps = {
    size: 15,
  };
  render() {
    return (
      <div
        className="str-chat__loading-indicator"
        style={{ width: this.props.size, height: this.props.size }}
      >
        <img
          src={svg}
          style={{ width: this.props.size, height: this.props.size }}
        />
      </div>
    );
  }
}
