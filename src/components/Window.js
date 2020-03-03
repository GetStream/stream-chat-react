import React from 'react';
import PropTypes from 'prop-types';

import { withChannelContext } from '../context';

/**
 * Window - A UI component for conditionally displaying thread or channel.
 *
 * @example ./docs/Window.md
 * @extends PureComponent
 */
class Window extends React.PureComponent {
  static propTypes = {
    /** show or hide the window when a thread is active */
    hideOnThread: PropTypes.bool,
    /** Flag if thread is open or not */
    thread: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  };

  static defaultProps = {
    hideOnThread: false,
  };

  render() {
    const { thread, hideOnThread, children } = this.props;

    // If thread is active and window should hide on thread. Return null
    if (thread && hideOnThread) {
      return null;
    }
    return <div className={`str-chat__main-panel`}>{children}</div>;
  }
}

Window = withChannelContext(Window);
export { Window };
