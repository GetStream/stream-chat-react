// @ts-check
import React, { useRef } from 'react';
// eslint-disable-next-line import/no-unresolved
import PropTypes from 'prop-types';
import { truncate } from '../../utils';

import { Avatar } from '../Avatar';

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 *
 * @example ../../docs/ChannelPreviewLastMessage.md
 * @type {import('types').ChannelPreviewLastMessage}
 */
const ChannelPreviewLastMessage = (props) => {
  /** @type {React.MutableRefObject<HTMLButtonElement | null>} Typescript syntax */
  const channelPreviewButton = useRef(null);
  const onSelectChannel = () => {
    props.setActiveChannel(props.channel, props.watchers);
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  const unreadClass =
    props.unread >= 1 ? 'str-chat__channel-preview--unread' : '';
  const activeClass = props.active ? 'str-chat__channel-preview--active' : '';

  return (
    <div className={`str-chat__channel-preview ${unreadClass} ${activeClass}`}>
      <button
        onClick={onSelectChannel}
        ref={channelPreviewButton}
        data-testid="channel-preview-button"
      >
        {props.unread >= 1 && (
          <div className="str-chat__channel-preview--dot" />
        )}
        <Avatar image={props.displayImage} name={props.displayTitle} />
        <div className="str-chat__channel-preview-info">
          <span className="str-chat__channel-preview-title">
            {props.displayTitle}
          </span>
          <span className="str-chat__channel-preview-last-message">
            {truncate(props.latestMessage, props.latestMessageLength)}
          </span>
          {props.unread >= 1 && (
            <span className="str-chat__channel-preview-unread-count">
              {props.unread}
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

ChannelPreviewLastMessage.defaultProps = {
  latestMessageLength: 20,
};

export default React.memo(ChannelPreviewLastMessage);
