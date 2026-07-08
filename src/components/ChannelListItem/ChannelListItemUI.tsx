import React, { useRef } from 'react';
import clsx from 'clsx';

import { ChannelListItemActionButtons as DefaultChannelListItemActionButtons } from './ChannelListItemActionButtons';
import { ChannelListItemTimestamp } from './ChannelListItemTimestamp';

import { ChannelAvatar as DefaultChannelAvatar } from '../Avatar';
import { Badge } from '../Badge';
import { IconMute, IconPin } from '../Icons';
import { useComponentContext, useTranslationContext } from '../../context';
import { useChatViewNavigation } from '../ChatView';
import type { ChannelListItemUIProps } from './ChannelListItem';
import { SummarizedMessagePreview } from '../SummarizedMessagePreview';

const UnMemoizedChannelListItemUI = (props: ChannelListItemUIProps) => {
  const {
    active,
    channel,
    className: customClassName = '',
    displayImage,
    displayTitle,
    groupChannelDisplayInfo,
    lastMessage,
    messageDeliveryStatus,
    muted,
    onSelect: customOnSelectChannel,
    pinned,
    unread,
  } = props;

  const {
    Avatar = DefaultChannelAvatar,
    ChannelListItemActionButtons = DefaultChannelListItemActionButtons,
  } = useComponentContext();
  const { t } = useTranslationContext();
  const { open } = useChatViewNavigation();

  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);

  const avatarName =
    displayTitle || channel.state.messages[channel.state.messages.length - 1]?.user?.id;

  const onSelectChannel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (customOnSelectChannel) {
      customOnSelectChannel(e);
    } else {
      // Selection is one navigation model: open the channel into a layout slot.
      open({ key: channel.cid ?? undefined, kind: 'channel', source: channel });
    }
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  return (
    <div className='str-chat__channel-list-item-container'>
      <button
        aria-label={t('aria/Select Channel: {{ channelName }}', {
          channelName: displayTitle || '',
        })}
        aria-selected={active}
        className={clsx(
          'str-chat__channel-list-item',
          {
            'str-chat__channel-list-item--muted': muted,
            'str-chat__channel-list-item--pinned': pinned,
            'str-chat__channel-list-item--unread':
              typeof unread === 'number' && unread > 0,
          },
          customClassName,
        )}
        data-testid='channel-list-item-button'
        onClick={onSelectChannel}
        ref={channelPreviewButton}
        role='option'
      >
        <Avatar
          displayMembers={groupChannelDisplayInfo?.members}
          imageUrl={displayImage}
          size='xl'
          userName={avatarName}
        />
        <div className='str-chat__channel-list-item-data'>
          <div className='str-chat__channel-list-item-data__first-row'>
            <div className='str-chat__channel-list-item-data__title'>
              <span>{displayTitle || 'N/A'}</span>
              {pinned && <IconPin />}
              {muted && <IconMute />}
            </div>
            <div className='str-chat__channel-list-item-data__timestamp-and-badge'>
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
      <ChannelListItemActionButtons />
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
