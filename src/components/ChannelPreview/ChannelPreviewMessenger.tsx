import React, { useRef } from 'react';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

import { truncate } from '../../utils';

import type { Channel } from 'stream-chat';

import type { ChatContextValue } from '../../context/ChatContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type ChannelPreviewMessengerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /** Comes from either the `channelRenderFilterFn` or `usePaginatedChannels` call from [ChannelList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelList.tsx) */
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /** If channel of component is active (selected) channel */
  active?: boolean;
  /** Current selected channel object */
  activeChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx)
   */
  Avatar?: React.ComponentType<AvatarProps>;
  /** Image of channel to display */
  displayImage?: string;
  /** Title of channel to display */
  displayTitle?: string;
  /** Latest message's text. */
  latestMessage?: string;
  /** Length of latest message to truncate at */
  latestMessageLength?: number;
  /** Setter for selected channel */
  setActiveChannel?: ChatContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['setActiveChannel'];
  /** Number of unread messages */
  unread?: number;
  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   */
  watchers?: { limit?: number; offset?: number };
};

const UnMemoizedChannelPreviewMessenger = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ChannelPreviewMessengerProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    active,
    Avatar = DefaultAvatar,
    channel,
    displayImage,
    displayTitle,
    latestMessage,
    latestMessageLength = 14,
    setActiveChannel,
    unread,
    watchers,
  } = props;

  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);

  const unreadClass =
    unread && unread >= 1 ? 'str-chat__channel-preview-messenger--unread' : '';

  const activeClass = active
    ? 'str-chat__channel-preview-messenger--active'
    : '';

  const onSelectChannel = () => {
    if (setActiveChannel) {
      setActiveChannel(channel, watchers);
    }
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  return (
    <button
      className={`str-chat__channel-preview-messenger ${unreadClass} ${activeClass}`}
      data-testid='channel-preview-button'
      onClick={onSelectChannel}
      ref={channelPreviewButton}
    >
      <div className='str-chat__channel-preview-messenger--left'>
        {<Avatar image={displayImage} name={displayTitle} size={40} />}
      </div>
      <div className='str-chat__channel-preview-messenger--right'>
        <div className='str-chat__channel-preview-messenger--name'>
          <span>{displayTitle}</span>
        </div>
        <div className='str-chat__channel-preview-messenger--last-message'>
          {truncate(latestMessage, latestMessageLength)}
        </div>
      </div>
    </button>
  );
};

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 * @example ./ChannelPreviewMessenger.md
 */
export const ChannelPreviewMessenger = React.memo(
  UnMemoizedChannelPreviewMessenger,
) as typeof UnMemoizedChannelPreviewMessenger;
