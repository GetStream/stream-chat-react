import React from 'react';
import clsx from 'clsx';
import {
  type ChannelPreviewDeliveryStatus,
  type ChannelPreviewMessageType,
  useLatestMessagePreview,
  type UseLatestMessagePreviewParams,
} from './hooks/useLatestMessagePreview';
import { useComponentContext } from '../../context';
import {
  IconCamera as DefaultIconCamera,
  IconCheckmark1Small as DefaultIconCheckmark1Small,
  IconChecks as DefaultIconChecks,
  IconClock as DefaultIconClock,
  IconExclamationCircleFill as DefaultIconExclamationCircleFill,
  IconFile as DefaultIconFile,
  IconGiphy as DefaultIconGiphy,
  IconLink as DefaultIconLink,
  IconLocation as DefaultIconLocation,
  IconNoSign as DefaultIconNoSign,
  IconUnsupportedAttachment as DefaultIconUnsupportedAttachment,
  IconVideo as DefaultIconVideo,
  IconVoice as DefaultIconVoice,
} from '../Icons';

export const SummarizedMessagePreview = ({
  latestMessage,
  messageDeliveryStatus,
  participantCount,
}: UseLatestMessagePreviewParams) => {
  const {
    icons: {
      IconCamera = DefaultIconCamera,
      IconCheckmark1Small = DefaultIconCheckmark1Small,
      IconChecks = DefaultIconChecks,
      IconClock = DefaultIconClock,
      IconExclamationCircleFill = DefaultIconExclamationCircleFill,
      IconFile = DefaultIconFile,
      IconGiphy = DefaultIconGiphy,
      IconLink = DefaultIconLink,
      IconLocation = DefaultIconLocation,
      IconNoSign = DefaultIconNoSign,
      IconUnsupportedAttachment = DefaultIconUnsupportedAttachment,
      IconVideo = DefaultIconVideo,
      IconVoice = DefaultIconVoice,
    } = {},
  } = useComponentContext();

  const deliveryStatusIconMap: Record<ChannelPreviewDeliveryStatus, React.ComponentType> =
    {
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
