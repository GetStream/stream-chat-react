// @ts-check

import React from 'react';
import PropTypes from 'prop-types';

import { ChatDown } from '../ChatDown';
import { LoadingChannels } from '../Loading';

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ../../docs/ChannelList.md
 * @type React.FC<import('types').ChannelListUIComponentProps>
 */
export const ChannelListMessenger = ({
  error = false,
  loading,
  LoadingErrorIndicator = ChatDown,
  LoadingIndicator = LoadingChannels,
  children,
}) => {
  if (error) {
    return <LoadingErrorIndicator type="Connection Error" />;
  }
  if (loading) {
    return <LoadingIndicator />;
  }
  return (
    <div className="str-chat__channel-list-messenger">
      <div className="str-chat__channel-list-messenger__main">{children}</div>
    </div>
  );
};

ChannelListMessenger.propTypes = {
  /** When true, loading indicator is shown - [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js) */
  loading: PropTypes.bool,
  /** When true, error indicator is shown - [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js) */
  error: PropTypes.bool,
  /**
   * Loading indicator UI Component. It will be displayed if `loading` prop is true.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator: /** @type {PropTypes.Validator<React.ElementType<import('types').LoadingIndicatorProps>>} */ (PropTypes.elementType),
  /**
   * Error indicator UI Component. It will be displayed if `error` prop is true
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator: /** @type {PropTypes.Validator<React.ElementType<import('types').ChatDownProps>>} */ (PropTypes.elementType),
};

export default ChannelListMessenger;
