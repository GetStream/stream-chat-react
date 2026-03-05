import React, { useRef } from 'react';
import clsx from 'clsx';

import { ChannelPreviewActionButtons as DefaultChannelPreviewActionButtons } from './ChannelPreviewActionButtons';
import { ChannelPreviewTimestamp } from './ChannelPreviewTimestamp';
import {
  type ChannelPreviewDeliveryStatus,
  type ChannelPreviewMessageType,
  useLatestMessagePreview,
} from './hooks/useLatestMessagePreview';

import { ChannelAvatar as DefaultChannelAvatar } from '../Avatar';
import { Badge } from '../Badge';
import {
  IconCamera1,
  IconChainLink,
  IconCheckmark1Small,
  IconCircleBanSign,
  IconClock,
  IconDoubleCheckmark1Small,
  IconExclamationCircle1,
  IconFileBend,
  IconMapPin,
  IconMicrophone,
  IconMute,
  IconVideo,
} from '../Icons';
import { useComponentContext } from '../../context';
import type { ChannelPreviewUIComponentProps } from './ChannelPreview';

const deliveryStatusIconMap: Record<ChannelPreviewDeliveryStatus, React.ComponentType> = {
  delivered: IconDoubleCheckmark1Small,
  read: IconDoubleCheckmark1Small,
  sending: IconClock,
  sent: IconCheckmark1Small,
};

const contentTypeIconMap: Partial<
  Record<ChannelPreviewMessageType, React.ComponentType>
> = {
  deleted: IconCircleBanSign,
  file: IconFileBend,
  link: IconChainLink,
  location: IconMapPin,
  photo: IconCamera1,
  video: IconVideo,
  voice: IconMicrophone,
};

const UnMemoizedChannelPreviewMessenger = (props: ChannelPreviewUIComponentProps) => {
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

  const { ChannelPreviewActionButtons = DefaultChannelPreviewActionButtons } =
    useComponentContext();

  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);

  const { deliveryStatus, senderName, text, type } = useLatestMessagePreview({
    channel,
    lastMessage,
    messageDeliveryStatus,
  });

  const DeliveryStatusIcon = deliveryStatus
    ? deliveryStatusIconMap[deliveryStatus]
    : undefined;
  const ContentTypeIcon = contentTypeIconMap[type];

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
      <ChannelPreviewActionButtons channel={channel} />
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
          groupChannelDisplayInfo={groupChannelDisplayInfo}
          imageUrl={displayImage}
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
              <ChannelPreviewTimestamp lastMessage={lastMessage} />
              {typeof unread === 'number' && unread > 0 && (
                <Badge data-testid='unread-badge' size='md' variant='primary'>
                  {unread}
                </Badge>
              )}
            </div>
          </div>
          <div
            className={clsx('str-chat__channel-preview-data__latest-message', {
              [`str-chat__channel-preview-data__latest-message--${type}`]: type,
            })}
          >
            {type === 'error' ? (
              <>
                <IconExclamationCircle1 />
                <span>{text}</span>
              </>
            ) : (
              <>
                {DeliveryStatusIcon && (
                  <span
                    className={clsx(
                      'str-chat__channel-preview-data__latest-message-delivery-status',
                      {
                        [`str-chat__channel-preview-data__latest-message-delivery-status--${deliveryStatus}`]:
                          deliveryStatus,
                      },
                    )}
                  >
                    <DeliveryStatusIcon />
                  </span>
                )}
                {senderName && (
                  <span className='str-chat__channel-preview-data__latest-message-sender'>
                    {senderName}:
                  </span>
                )}
                {ContentTypeIcon && <ContentTypeIcon />}
                <span>{text}</span>
              </>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 */
export const ChannelPreviewMessenger = React.memo(
  UnMemoizedChannelPreviewMessenger,
) as typeof UnMemoizedChannelPreviewMessenger;
