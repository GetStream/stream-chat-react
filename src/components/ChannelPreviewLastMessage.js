import React, { useState, useEffect } from 'react';
import { Avatar } from './Avatar';
import PropTypes from 'prop-types';
import truncate from 'lodash/truncate';

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 *
 * @example ./docs/ChannelPreviewLastMessage.md
 * @extends PureComponent
 */

export const ChannelPreviewLastMessage = ({
  channel,
  emptyMessageText = 'Nothing yet...',
  latestMessageLength = 14,
  unread,
  latestMessage,
  setActiveChannel = () => {},
  watchers,
  active,
}) => {
  const channelPreviewButton = React.createRef();
  const [unreadClass, setUnreadClass] = useState('');
  const [activeClass, setActiveClass] = useState('');
  const [name, setName] = useState(channel.data.name || channel.cid);

  useEffect(() => {
    setUnreadClass(unread >= 1 ? 'str-chat__channel-preview--unread' : '');
    setActiveClass(active ? 'str-chat__channel-preview--active' : '');
    setName(channel.data.name || channel.cid);
  }, [channel, unread, active]);

  const onSelectChannel = () => {
    setActiveChannel(channel, watchers);
    channelPreviewButton.current.blur();
  };

  return (
    <div className={`str-chat__channel-preview ${unreadClass} ${activeClass}`}>
      <button onClick={onSelectChannel} ref={channelPreviewButton}>
        {unread >= 1 && (
          <div
            className="str-chat__channel-preview--dot"
            data-testid="channel-preview-last-message-dot"
          />
        )}
        <Avatar image={channel.data.image} />
        <div className="str-chat__channel-preview-info">
          <span className="str-chat__channel-preview-title">{name}</span>
          <span className="str-chat__channel-preview-last-message">
            {!latestMessage
              ? emptyMessageText
              : truncate(latestMessage, {
                  length: latestMessageLength,
                })}
          </span>
          {unread >= 1 && (
            <span
              className="str-chat__channel-preview-unread-count"
              data-testid="channel-preview-last-message-unread-count"
            >
              {unread}
            </span>
          )}
        </div>
      </button>
    </div>
  );
};

ChannelPreviewLastMessage.propTypes = {
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
