import React, { useEffect, useState } from 'react';
import { Avatar } from './Avatar';
import PropTypes from 'prop-types';

/**
 *
 * @example ./docs/ChannelPreviewCompact.md
 * @extends PureComponent
 *
 */
export const ChannelPreviewCompact = ({
  channel,
  unread,
  setActiveChannel = () => {},
  watchers,
  active,
}) => {
  const [unreadClass, setUnreadClass] = useState('');
  const [activeClass, setActiveClass] = useState('');
  const [name, setName] = useState('');
  const channelPreviewButton = React.createRef();

  useEffect(() => {
    setUnreadClass(
      unread >= 1 ? 'str-chat__channel-preview-compact--unread' : '',
    );
    setActiveClass(active ? 'str-chat__channel-preview-compact--active' : '');
    setName(channel.data.name || channel.cid);
  });

  const onSelectChannel = () => {
    setActiveChannel(channel, watchers);
    channelPreviewButton.current.blur();
  };

  return (
    <button
      onClick={onSelectChannel}
      ref={channelPreviewButton}
      className={`str-chat__channel-preview-compact ${unreadClass} ${activeClass}`}
    >
      <div className="str-chat__channel-preview-compact--left">
        <Avatar image={channel.data.image} size={20} />
      </div>
      <div className="str-chat__channel-preview-compact--right">{name}</div>
    </button>
  );
};

ChannelPreviewCompact.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.object.isRequired,
  /** Current selected channel object */
  activeChannel: PropTypes.object,
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
};
