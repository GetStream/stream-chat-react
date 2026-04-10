import React from 'react';
import clsx from 'clsx';
import {
  type ChannelPreviewDeliveryStatus,
  type ChannelPreviewMessageType,
  useLatestMessagePreview,
  type UseLatestMessagePreviewParams,
} from './hooks/useLatestMessagePreview';
import {
  IconCamera,
  IconCheckmark1Small,
  IconChecks,
  IconClock,
  IconExclamationCircleFill,
  IconFile,
  IconGiphy,
  IconLink,
  IconLocation,
  IconNoSign,
  IconUnsupportedAttachment,
  IconVideo,
  IconVoice,
} from '../Icons';

const deliveryStatusIconMap: Record<ChannelPreviewDeliveryStatus, React.ComponentType> = {
  delivered: IconChecks,
  read: IconChecks,
  sending: IconClock,
  sent: IconCheckmark1Small,
};

const contentTypeIconMap: Partial<
  Record<ChannelPreviewMessageType, React.ComponentType>
> = {
  deleted: IconNoSign,
  error: IconExclamationCircleFill,
  file: IconFile,
  giphy: IconGiphy,
  image: IconCamera,
  link: IconLink,
  location: IconLocation,
  unsupported: IconUnsupportedAttachment,
  video: IconVideo,
  voice: IconVoice,
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
