// @ts-check
import React, { useRef } from 'react';
// eslint-disable-next-line import/no-unresolved
import PropTypes from 'prop-types';
import { Channel } from 'stream-chat';

import { Avatar as DefaultAvatar } from '../Avatar';

/**
 *
 * @example ../../docs/ChannelPreviewCompact.md
 * @type {import('types').ChannelPreviewCompact}
 */
const ChannelPreviewCompact = (props) => {
  const { Avatar = DefaultAvatar } = props;
  /**
   * @type {React.MutableRefObject<HTMLButtonElement | null>} Typescript syntax
   */
  const channelPreviewButton = useRef(null);
  const unreadClass =
    props.unread_count >= 1 ? 'str-chat__channel-preview-compact--unread' : '';
  const activeClass = props.active
    ? 'str-chat__channel-preview-compact--active'
    : '';

  const onSelectChannel = () => {
    props.setActiveChannel(props.channel, props.watchers);
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  return (
    <button
      className={`str-chat__channel-preview-compact ${unreadClass} ${activeClass}`}
      data-testid='channel-preview-button'
      onClick={onSelectChannel}
      ref={channelPreviewButton}
    >
      <div className='str-chat__channel-preview-compact--left'>
        <Avatar
          image={props.displayImage}
          name={props.displayTitle}
          size={20}
        />
      </div>
      <div className='str-chat__channel-preview-compact--right'>
        {props.displayTitle}
      </div>
    </button>
  );
};

ChannelPreviewCompact.propTypes = {
  /** If channel of component is active (selected) channel */
  active: PropTypes.bool,
  /** Current selected channel object */
  activeChannel: PropTypes.instanceOf(Channel),
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar: /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */ (PropTypes.elementType),
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.instanceOf(Channel).isRequired,
  /** Image of channel to display */
  displayImage: PropTypes.string,
  /** Title of channel to display */
  displayTitle: PropTypes.string,
  /** Latest message's text. */
  latestMessage: PropTypes.string,
  /** Setter for selected channel */
  setActiveChannel: PropTypes.func.isRequired,
  /** Number of unread messages */
  unread: PropTypes.number,
  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   * */
  watchers: /** @type {PropTypes.Validator<{ limit?: number | undefined; offset?: number | undefined} | null | undefined> | undefined} */ (PropTypes.object),
};

export default React.memo(ChannelPreviewCompact);
