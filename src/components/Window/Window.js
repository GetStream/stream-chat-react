import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { ChannelContext } from '../../context';

/**
 * Window - A UI component for conditionally displaying thread or channel.
 *
 * @example ../../docs/Window.md
 */

const Window = ({ children }) => {
  const { thread, hideOnThread } = useContext(ChannelContext);
  // If thread is active and window should hide on thread. Return null
  if (thread && hideOnThread) return null;

  return <div className={`str-chat__main-panel`}>{children}</div>;
};

Window.defaultProps = {
  hideOnThread: false,
};

Window.propTypes = {
  /** show or hide the window when a thread is active */
  hideOnThread: PropTypes.bool,
  /** Flag if thread is open or not */
  thread: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
};

export default React.memo(Window);
