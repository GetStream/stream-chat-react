import React from 'react';
import clsx from 'clsx';
import {
  type ChannelPreviewDeliveryStatus,
  type ChannelPreviewMessageType,
  useLatestMessagePreview,
  type UseLatestMessagePreviewParams,
} from './hooks/useLatestMessagePreview';
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
  IconVideo,
} from '../Icons';

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
  error: IconExclamationCircle1,
  file: IconFileBend,
  image: IconCamera1,
  link: IconChainLink,
  location: IconMapPin,
  video: IconVideo,
  voice: IconMicrophone,
};

export const SummarizedMessagePreview = ({
  latestMessage,
  messageDeliveryStatus,
  participantCount,
}: UseLatestMessagePreviewParams) => {
  const { deliveryStatus, senderName, text, type } = useLatestMessagePreview({
    latestMessage,
    messageDeliveryStatus,
    participantCount,
  });

  const DeliveryStatusIcon = deliveryStatus
    ? deliveryStatusIconMap[deliveryStatus]
    : undefined;
  const ContentTypeIcon = contentTypeIconMap[type];

  return (
    <div
      className={clsx('str-chat__summarized-message-preview', {
        [`str-chat__summarized-message-preview--${type}`]: type,
      })}
    >
      {type !== 'error' && (
        <>
          {DeliveryStatusIcon && (
            <span
              className={clsx('str-chat__summarized-message-preview__delivery-status', {
                [`str-chat__summarized-message-preview__delivery-status--${deliveryStatus}`]:
                  deliveryStatus,
              })}
            >
              <DeliveryStatusIcon />
            </span>
          )}
          {senderName && (
            <span className='str-chat__summarized-message-preview__sender'>
              {senderName}:
            </span>
          )}
        </>
      )}
      {ContentTypeIcon && <ContentTypeIcon />}
      <span className='str-chat__summarized-message-preview__text'>{text}</span>
    </div>
  );
};
