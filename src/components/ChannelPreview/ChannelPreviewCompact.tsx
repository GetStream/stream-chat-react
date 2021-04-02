import React, { useRef } from 'react';

import { Avatar as DefaultAvatar } from '../Avatar/Avatar';

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

const UnMemoizedChannelPreviewCompact = <
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
    setActiveChannel,
    unread,
    watchers,
  } = props;

  const channelPreviewButton = useRef<HTMLButtonElement>(null);
  const unreadClass = unread && unread >= 1 ? 'str-chat__channel-preview-compact--unread' : '';
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
      <div className='str-chat__channel-preview-compact--right'>{displayTitle}</div>
    </button>
  );
};

/**
 *  Used as preview component for channel item in [ChannelList](#channellist) component.
 * @example ./ChannelPreviewCompact.md
 */
export const ChannelPreviewCompact = React.memo(
  UnMemoizedChannelPreviewCompact,
) as typeof UnMemoizedChannelPreviewCompact;
