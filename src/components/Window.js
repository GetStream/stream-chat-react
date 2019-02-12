import React from 'react';

import PropTypes from 'prop-types';

import { withChannelContext } from '../context';

class Window extends React.PureComponent {
  static propTypes = {
    /** show or hide the window when a thread is active */
    hideOnThread: PropTypes.bool,
  };

  static defaultProps = {
    hideOnThread: false,
  };

  render() {
    if (this.props.thread && this.props.hideOnThread) {
      return null;
    }
    return <div className={`str-chat__main-panel`}>{this.props.children}</div>;
  }
}

Window = withChannelContext(Window);
export { Window };
