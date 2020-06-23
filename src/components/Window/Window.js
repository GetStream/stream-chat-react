// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { ChannelContext } from '../../context';

/**
 * Window - A UI component for conditionally displaying thread or channel.
 *
 * @example ../../docs/Window.md
 * @type { React.FC<import('types').WindowProps>}
 */
const Window = ({ children, hideOnThread = false }) => {
  const { thread } = useContext(ChannelContext);
  // If thread is active and window should hide on thread. Return null
  if (thread && hideOnThread) return null;

  return <div className={`str-chat__main-panel`}>{children}</div>;
};

Window.propTypes = {
  /** show or hide the window when a thread is active */
  hideOnThread: PropTypes.bool,
  /** Flag if thread is open or not */
  thread: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      created_at: PropTypes.string.isRequired,
      updated_at: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      html: PropTypes.string.isRequired,
    }).isRequired,
  ]).isRequired,
};

export default React.memo(Window);
