import React, { useRef } from 'react';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar/Avatar';

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

export type ChannelPreviewCompactProps<
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

const UnMemoizedChannelPreviewCompact = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ChannelPreviewCompactProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    active,
    Avatar = DefaultAvatar,
    channel,
    displayImage,
    displayTitle,
    setActiveChannel,
    unread,
    watchers,
  } = props;

  const channelPreviewButton = useRef<HTMLButtonElement>(null);
  const unreadClass =
    unread && unread >= 1 ? 'str-chat__channel-preview-compact--unread' : '';
  const activeClass = active ? 'str-chat__channel-preview-compact--active' : '';

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
      className={`str-chat__channel-preview-compact ${unreadClass} ${activeClass}`}
      data-testid='channel-preview-button'
      onClick={onSelectChannel}
      ref={channelPreviewButton}
    >
      <div className='str-chat__channel-preview-compact--left'>
        <Avatar image={displayImage} name={displayTitle} size={20} />
      </div>
      <div className='str-chat__channel-preview-compact--right'>
        {displayTitle}
      </div>
    </button>
  );
};

/**
 * @example ./ChannelPreviewCompact.md
 */
export const ChannelPreviewCompact = React.memo(
  UnMemoizedChannelPreviewCompact,
) as typeof UnMemoizedChannelPreviewCompact;
