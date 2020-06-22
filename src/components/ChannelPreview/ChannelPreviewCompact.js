/* eslint-disable */
import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import { Avatar } from '../Avatar';

/**
 *
 * @example ../../docs/ChannelPreviewCompact.md
 * @extends PureComponent
 *
 */
const ChannelPreviewCompact = (props) => {
  const channelPreviewButton = useRef();
  const unreadClass =
    props.unread_count >= 1 ? 'str-chat__channel-preview-compact--unread' : '';
  const activeClass = props.active
    ? 'str-chat__channel-preview-compact--active'
    : '';

  const onSelectChannel = () => {
    props.setActiveChannel(props.channel, props.watchers);
    channelPreviewButton.current.blur();
  };

  return (
    <button
      data-testid="channel-preview-button"
      onClick={onSelectChannel}
      ref={channelPreviewButton}
      className={`str-chat__channel-preview-compact ${unreadClass} ${activeClass}`}
    >
      <div className="str-chat__channel-preview-compact--left">
        <Avatar image={props.displayImage} size={20} />
      </div>
      <div className="str-chat__channel-preview-compact--right">
        {props.displayTitle}
      </div>
    </button>
  );
};

ChannelPreviewCompact.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.object.isRequired,
  /** Current selected channel object */
  activeChannel: PropTypes.object,
  /** Setter for selected channel */
  setActiveChannel: PropTypes.func.isRequired,
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
  /** Title of channel to display */
  displayTitle: PropTypes.string,
  /** Image of channel to display */
  displayImage: PropTypes.string,
};

export default React.memo(ChannelPreviewCompact);
