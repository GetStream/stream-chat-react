import { useMemo } from 'react';
import type { Attachment, LocalMessage, VoiceRecordingAttachment } from 'stream-chat';
import {
  isAudioAttachment,
  isFileAttachment,
  isImageAttachment,
  isScrapedContent,
  isVideoAttachment,
  isVoiceRecordingAttachment,
} from 'stream-chat';

import {
  getTranslatedMessageText,
  type TranslationContextValue,
  useChatContext,
  useTranslationContext,
} from '../../../context';
import { isMessageDeleted } from '../../Message/utils';

import type { MessageDeliveryStatus } from '../../ChannelListItem';

export type ChannelPreviewMessageType =
  | 'text'
  | 'deleted'
  | 'error'
  | 'empty'
  | 'image'
  | 'giphy'
  | 'video'
  | 'voice'
  | 'file'
  | 'unsupported'
  | 'link'
  | 'location'
  | 'poll';

const SUPPORTED_VIDEO_FORMATS: string[] = [
  'video/mp4',
  'video/ogg',
  'video/webm',
  'video/quicktime',
];

/**
 * Delivery status of the last own message, which selects the status icon: a clock for `sending`, a
 * checkmark for `sent`, double checkmarks for `delivered` and `read`.
 */
export type ChannelPreviewDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

export type LatestMessagePreviewData = {
  /** Kind of content previewed, which selects the content-type icon. */
  type: ChannelPreviewMessageType;
  text: string;
  /** Set only for own messages that did not fail to send. */
  deliveryStatus?: ChannelPreviewDeliveryStatus;
  /**
   * Sender prefix: "You" (translated) for own messages, the sender's name for incoming messages
   * when `participantCount` is above 2, otherwise undefined.
   */
  senderName?: string;
};

function getAttachmentContentType(attachment: Attachment): ChannelPreviewMessageType {
  if (!attachment) return 'text';

  if (attachment.type === 'giphy') return 'giphy';
  if (isScrapedContent(attachment)) return 'link';
  if (isImageAttachment(attachment)) return 'image';
  if (isVideoAttachment(attachment, SUPPORTED_VIDEO_FORMATS)) return 'video';
  if (isVoiceRecordingAttachment(attachment)) return 'voice';
  if (
    isAudioAttachment(attachment) ||
    isFileAttachment(attachment, SUPPORTED_VIDEO_FORMATS)
  ) {
    return 'file';
  }

  return 'unsupported';
}

function getAttachmentFallbackText(
  type: ChannelPreviewMessageType,
  count: number,
  t: TranslationContextValue['t'],
): string {
  switch (type) {
    case 'image':
      return t('messagePreview.latestMessagePreview.imageCount.label', {
        count,
        defaultValue_one: 'Image',
        defaultValue_other: '{{ count }} images',
      });
    case 'video':
      return t('messagePreview.latestMessagePreview.videoCount.label', {
        count,
        defaultValue_one: 'Video',
        defaultValue_other: '{{ count }} videos',
      });
    case 'voice':
      return t('messagePreview.latestMessagePreview.voiceMessageCount.label', {
        count,
        defaultValue_one: 'Voice message',
        defaultValue_other: '{{ count }} voice messages',
      });
    case 'link':
      return t('messagePreview.latestMessagePreview.linkCount.label', {
        count,
        defaultValue_one: 'Link',
        defaultValue_other: '{{ count }} links',
      });
    case 'file':
      return t('messagePreview.latestMessagePreview.fileCount.label', {
        count,
        defaultValue_one: 'File',
        defaultValue_other: '{{ count }} files',
      });
    case 'unsupported':
      return t('common.unsupportedAttachment.text', 'Unsupported attachment');
    default:
      return t('messagePreview.latestMessagePreview.fileCount.label', {
        count,
        defaultValue_one: 'File',
        defaultValue_other: '{{ count }} files',
      });
  }
}

export type UseLatestMessagePreviewParams = {
  /** Number of channel participants. Incoming messages show the sender above 2. */
  participantCount?: number;
  /** Message to preview. Without one the preview is the empty-state text. */
  latestMessage?: LocalMessage;
  /**
   * Delivery status from `useMessageDeliveryStatus`. Defaults to the message's own `status` for
   * own messages.
   */
  messageDeliveryStatus?: MessageDeliveryStatus;
};

export const useLatestMessagePreview = ({
  latestMessage,
  messageDeliveryStatus,
  participantCount,
}: UseLatestMessagePreviewParams): LatestMessagePreviewData => {
  const { client } = useChatContext();
  const { t, userLanguage } = useTranslationContext();

  return useMemo(() => {
    if (!latestMessage) {
      return {
        text: t('common.nothingYet.text', 'Nothing yet...'),
        type: 'empty' as const,
      };
    }

    if (latestMessage.status === 'failed' || latestMessage.type === 'error') {
      return {
        text: t(
          'messagePreview.latestMessagePreview.messageFailedSend.text',
          'Message failed to send',
        ),
        type: 'error' as const,
      };
    }

    const isOwnMessage = latestMessage.user?.id === client.user?.id;

    let deliveryStatus: ChannelPreviewDeliveryStatus | undefined;
    if (isOwnMessage) {
      deliveryStatus = messageDeliveryStatus ?? (latestMessage.status as 'sending');
    }

    let senderName: string | undefined;
    if (isOwnMessage) {
      senderName = t('common.you.label', 'You');
    } else if (!isOwnMessage && participantCount !== undefined && participantCount > 2) {
      senderName = latestMessage.user?.name || latestMessage.user?.id;
    }

    if (isMessageDeleted(latestMessage)) {
      return {
        deliveryStatus,
        senderName,
        text: t('common.messageDeleted.text', 'Message deleted'),
        type: 'deleted' as const,
      };
    }

    if (latestMessage.poll) {
      return {
        deliveryStatus,
        senderName,
        text: t('common.poll.label', 'Poll'),
        type: 'poll' as const,
      };
    }

    const textContent =
      getTranslatedMessageText({ language: userLanguage, message: latestMessage }) ||
      latestMessage.text;

    if (latestMessage.shared_location) {
      return {
        deliveryStatus,
        senderName,
        text: textContent || t('common.location.text', 'Location'),
        type: 'location' as const,
      };
    }

    if (latestMessage.attachments && latestMessage.attachments.length) {
      const attachments = latestMessage.attachments;

      let contentType: ChannelPreviewMessageType;

      const [firstAttachment] = attachments;
      const firstAttachmentType = getAttachmentContentType(firstAttachment);

      if (
        attachments.every(
          (attachment) => getAttachmentContentType(attachment) === firstAttachmentType,
        )
      ) {
        contentType = firstAttachmentType;
      } else {
        contentType = 'file';
      }

      let text =
        contentType === 'giphy'
          ? `GIPHY ${firstAttachment.title ?? ''}`.trim()
          : // message text first
            textContent ||
            // then a lone attachment's fallback or title, skipped for voice and unsupported ones
            // because their fallback text is generic
            (attachments.length === 1 &&
            contentType !== 'voice' &&
            contentType !== 'unsupported'
              ? firstAttachment.fallback || firstAttachment.title
              : '') ||
            // then a generic label from the attachment type and count
            getAttachmentFallbackText(contentType, attachments.length, t);

      // Appends the duration of a lone attachment that has one. `Attachment.custom` is typed as
      // required but is missing at runtime on some attachments (og-scraped, giphy, custom
      // integrations), and the cast covers every type, so it is read defensively.
      const firstAttachmentDuration = (firstAttachment as VoiceRecordingAttachment).custom
        ?.duration;
      if (attachments.length === 1 && typeof firstAttachmentDuration === 'number') {
        const minutes = Math.floor(firstAttachmentDuration / 60);
        const seconds = Math.ceil(firstAttachmentDuration) % 60;
        const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        text += ` (${durationString})`;
      }

      return {
        deliveryStatus,
        senderName,
        text,
        type: contentType,
      };
    }

    if (textContent) {
      return {
        deliveryStatus,
        senderName,
        text: textContent,
        type: 'text' as const,
      };
    }

    return {
      text: t('common.emptyMessage.text', 'Empty message...'),
      type: 'empty' as const,
    };
  }, [
    client.user?.id,
    latestMessage,
    messageDeliveryStatus,
    participantCount,
    t,
    userLanguage,
  ]);
};
