import React, { useRef } from 'react';
import clsx from 'clsx';

import { ChannelListItemActionButtons as DefaultChannelListItemActionButtons } from './ChannelListItemActionButtons';
import { ChannelListItemTimestamp } from './ChannelListItemTimestamp';

import { ChannelAvatar as DefaultChannelAvatar } from '../Avatar';
import { Badge } from '../Badge';
import { IconMute } from '../Icons';
import { useComponentContext } from '../../context';
import type { ChannelListItemUIProps } from './ChannelListItem';
import { SummarizedMessagePreview } from '../SummarizedMessagePreview';

const UnMemoizedChannelListItemUI = (props: ChannelListItemUIProps) => {
  const {
    active,
    Avatar = DefaultChannelAvatar,
    channel,
    className: customClassName = '',
    displayImage,
    displayTitle,
    groupChannelDisplayInfo,
    lastMessage,
    messageDeliveryStatus,
    muted,
    onSelect: customOnSelectChannel,
    setActiveChannel,
    unread,
    watchers,
  } = props;

  const { ChannelListItemActionButtons = DefaultChannelListItemActionButtons } =
    useComponentContext();

  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);

  const avatarName =
    displayTitle || channel.state.messages[channel.state.messages.length - 1]?.user?.id;

  const onSelectChannel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (customOnSelectChannel) {
      customOnSelectChannel(e);
    } else if (setActiveChannel) {
      setActiveChannel(channel, watchers);
    }
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  return (
    <div className='str-chat__channel-preview-container'>
      <ChannelListItemActionButtons />
      <button
        aria-label={`Select Channel: ${displayTitle || ''}`}
        aria-pressed={active}
        className={clsx(
          'str-chat__channel-preview',
          typeof unread === 'number' && unread > 0 && 'str-chat__channel-preview--unread',
          muted && 'str-chat__channel-preview--muted',
          customClassName,
        )}
        data-testid='channel-preview-button'
        onClick={onSelectChannel}
        ref={channelPreviewButton}
        role='option'
      >
        <Avatar
          displayMembers={groupChannelDisplayInfo?.members}
          imageUrl={displayImage}
          overflowCount={groupChannelDisplayInfo?.overflowCount}
          size='xl'
          userName={avatarName}
        />
        <div className='str-chat__channel-preview-data'>
          <div className='str-chat__channel-preview-data__first-row'>
            <div className='str-chat__channel-preview-data__title'>
              <span>{displayTitle || 'N/A'}</span>
              {muted && <IconMute />}
            </div>
            <div className='str-chat__channel-preview-data__timestamp-and-badge'>
              <ChannelListItemTimestamp lastMessage={lastMessage} />
              {typeof unread === 'number' && unread > 0 && (
                <Badge data-testid='unread-badge' size='md' variant='primary'>
                  {unread}
                </Badge>
              )}
            </div>
          </div>
          <SummarizedMessagePreview
            latestMessage={lastMessage}
            messageDeliveryStatus={messageDeliveryStatus}
            participantCount={channel.data?.member_count}
          />
        </div>
      </button>
    </div>
  );
};

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 */
export const ChannelListItemUI = React.memo(
  UnMemoizedChannelListItemUI,
) as typeof UnMemoizedChannelListItemUI;
