// @ts-check
import React, { useRef } from 'react';
// eslint-disable-next-line import/no-unresolved
import PropTypes from 'prop-types';
import { truncate } from '../../utils';

import { Avatar } from '../Avatar';

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 *
 * @example ../../docs/ChannelPreviewMessenger.md
 * @type {import('types').ChannelPreviewMessenger}
 */
const ChannelPreviewMessenger = (props) => {
  /** @type {React.MutableRefObject<HTMLButtonElement | null>} Typescript syntax */
  const channelPreviewButton = useRef(null);
  const unreadClass =
    props.unread >= 1 ? 'str-chat__channel-preview-messenger--unread' : '';
  const activeClass = props.active
    ? 'str-chat__channel-preview-messenger--active'
    : '';
  const onSelectChannel = () => {
    props.setActiveChannel(props.channel, props.watchers);
    // eslint-disable-next-line no-unused-expressions
    channelPreviewButton?.current?.blur();
  };

  return (
    <button
      onClick={onSelectChannel}
      ref={channelPreviewButton}
      className={`str-chat__channel-preview-messenger ${unreadClass} ${activeClass}`}
      data-testid="channel-preview-button"
    >
      <div className="str-chat__channel-preview-messenger--left">
        {<Avatar image={props.displayImage} size={40} />}
      </div>
      <div className="str-chat__channel-preview-messenger--right">
        <div className="str-chat__channel-preview-messenger--name">
          <span>{props.displayTitle}</span>
        </div>
        <div className="str-chat__channel-preview-messenger--last-message">
          {truncate(props.latestMessage, props.latestMessageLength)}
        </div>
      </div>
    </button>
  );
};

ChannelPreviewMessenger.propTypes = {
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
  /** Length of latest message to truncate at */
  latestMessageLength: PropTypes.number,
  /** Title of channel to display */
  displayTitle: PropTypes.string,
  /** Image of channel to display */
  displayImage: PropTypes.string,
};

ChannelPreviewMessenger.defaultProps = {
  latestMessageLength: 14,
};

export default React.memo(ChannelPreviewMessenger);
