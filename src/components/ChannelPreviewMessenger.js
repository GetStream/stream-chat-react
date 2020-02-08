import React from 'react';
import PropTypes from 'prop-types';

import { Avatar } from './Avatar';

import truncate from 'lodash/truncate';
/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 *
 * @example ./docs/ChannelPreviewMessenger.md
 * @extends PureComponent
 */
export const ChannelPreviewMessenger = ({
  channel,
  emptyMessageText = 'Nothing yet...',
  latestMessageLength = 14,
  unread,
  latestMessage,
  activeChannel,
  setActiveChannel = () => {},
  watchers,
  closeMenu,
}) => {
  const channelPreviewButton = React.createRef();
  const unreadClass =
    unread >= 1 ? 'str-chat__channel-preview-messenger--unread' : '';
  const activeClass =
    activeChannel.cid === channel.cid
      ? 'str-chat__channel-preview-messenger--active'
      : '';

  const onSelectChannel = () => {
    setActiveChannel(channel, watchers);
    channelPreviewButton.current.blur();
    closeMenu();
  };

  return (
    <button
      onClick={onSelectChannel}
      ref={channelPreviewButton}
      className={`str-chat__channel-preview-messenger ${unreadClass} ${activeClass}`}
    >
      <div className="str-chat__channel-preview-messenger--left">
        {<Avatar image={channel.data.image} size={40} />}
      </div>
      <div className="str-chat__channel-preview-messenger--right">
        <div className="str-chat__channel-preview-messenger--name">
          <span>{channel.data.name}</span>
        </div>
        <div className="str-chat__channel-preview-messenger--last-message">
          {!latestMessage
            ? emptyMessageText
            : truncate(latestMessage, {
                length: latestMessageLength,
              })}
        </div>
      </div>
    </button>
  );
};

ChannelPreviewMessenger.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.object.isRequired,
  /** Current selected channel object */
  activeChannel: PropTypes.object.isRequired,
  /** Setter for selected channel */
  setActiveChannel: PropTypes.func,
  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   * */
  watchers: PropTypes.object,
  /** Number of unread messages */
  unread: PropTypes.number,
  /** If channel of component is active (selected) channel */
  active: PropTypes.bool,
  /** Latest message's text. */
  latestMessage: PropTypes.string,
  /** Length of latest message to truncate at */
  latestMessageLength: PropTypes.number,
  /** Text to display in place of latest message, when channel has no messages yet. */
  emptyMessageText: PropTypes.string,
};
