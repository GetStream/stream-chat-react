import React from 'react';
import PropTypes from 'prop-types';

/**
 * LoadingErrorIndicator - UI component for error indicator in Channel.
 *
 * @example ./docs/LoadingErrorIndicator.md
 * @extends PureComponent
 */
export class LoadingErrorIndicator extends React.PureComponent {
  static propTypes = {
    /** Error object */
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  };
  static defaultProps = {
    error: false,
  };

  render() {
    if (!this.props.error) return null;

    return <div>Error: {this.props.error.message}</div>;
  }
}
