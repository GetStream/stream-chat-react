import React, { useRef } from 'react';

import { Avatar as DefaultAvatar } from '../Avatar';

import { truncate } from '../../utils';

import type { ChannelPreviewUIComponentProps } from './ChannelPreview';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

const UnMemoizedChannelPreviewLastMessage = <
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
    latestMessageLength = 20,
    setActiveChannel,
    unread,
    watchers,
  } = props;
  const channelPreviewButton = useRef<HTMLButtonElement>(null);
  const onSelectChannel = () => {
    if (setActiveChannel) {
      setActiveChannel(channel, watchers);
    }
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  const unreadClass =
    unread && unread >= 1 ? 'str-chat__channel-preview--unread' : '';
  const activeClass = active ? 'str-chat__channel-preview--active' : '';

  return (
    <div className={`str-chat__channel-preview ${unreadClass} ${activeClass}`}>
      <button
        data-testid='channel-preview-button'
        onClick={onSelectChannel}
        ref={channelPreviewButton}
      >
        {unread && unread >= 1 ? (
          <div className='str-chat__channel-preview--dot' />
        ) : null}
        <Avatar image={displayImage} name={displayTitle} />
        <div className='str-chat__channel-preview-info'>
          <span className='str-chat__channel-preview-title'>
            {displayTitle}
          </span>
          <span className='str-chat__channel-preview-last-message'>
            {truncate(latestMessage, latestMessageLength)}
          </span>
          {unread && unread >= 1 ? (
            <span className='str-chat__channel-preview-unread-count'>
              {unread}
            </span>
          ) : null}
        </div>
      </button>
    </div>
  );
};

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component
 * @example ./ChannelPreviewLastMessage.md
 */
export const ChannelPreviewLastMessage = React.memo(
  UnMemoizedChannelPreviewLastMessage,
) as typeof UnMemoizedChannelPreviewLastMessage;
