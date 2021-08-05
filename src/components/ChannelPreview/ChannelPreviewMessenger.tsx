import React, { useRef } from 'react';

import { Avatar as DefaultAvatar } from '../Avatar';

import type { ChannelPreviewUIComponentProps } from './ChannelPreview';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

const UnMemoizedChannelPreviewMessenger = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: ChannelPreviewUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    active,
    Avatar = DefaultAvatar,
    channel,
    displayImage,
    displayTitle,
    latestMessage,
    setActiveChannel,
    unread,
    watchers,
  } = props;

  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);

  const activeClass = active ? 'str-chat__channel-preview-messenger--active' : '';
  const unreadClass = unread && unread >= 1 ? 'str-chat__channel-preview-messenger--unread' : '';

  const avatarName =
    displayTitle || channel.state.messages[channel.state.messages.length - 1]?.user?.id;

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
        <Avatar image={displayImage} name={avatarName} size={40} />
      </div>
      <div className='str-chat__channel-preview-messenger--right'>
        <div className='str-chat__channel-preview-messenger--name'>
          <span>{displayTitle}</span>
        </div>
        <div className='str-chat__channel-preview-messenger--last-message'>{latestMessage}</div>
      </div>
    </button>
  );
};

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 */
export const ChannelPreviewMessenger = React.memo(
  UnMemoizedChannelPreviewMessenger,
) as typeof UnMemoizedChannelPreviewMessenger;
