import { useMemo } from 'react';
import type { Attachment, LocalMessage } from 'stream-chat';

import {
  getTranslatedMessageText,
  type TranslationContextValue,
  useChatContext,
  useTranslationContext,
} from '../../../context';

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
  | 'link'
  | 'location'
  | 'poll';

/**
 * Delivery status of the last own message.
 * Determines which delivery status icon to render in the preview.
 *
 * - `sending` — Clock icon
 * - `sent` — Single checkmark icon
 * - `delivered` — Double checkmark icon
 * - `read` — Double checkmark icon (with distinct color)
 */
export type ChannelPreviewDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

export type LatestMessagePreviewData = {
  /**
   * The type of content being previewed.
   * Use this to render the appropriate content-type icon.
   */
  type: ChannelPreviewMessageType;
  /**
   * The preview text to display.
   */
  text: string;
  /**
   * Delivery status of own message.
   * Only present for own messages that are not in error state.
   * Use this to render the delivery status icon (clock, checkmark, double checkmark).
   */
  deliveryStatus?: ChannelPreviewDeliveryStatus;
  /**
   * Sender name prefix.
   * - `"You"` (translated) for own messages
   * - Sender's display name for incoming messages in group channels (>2 members)
   * - `undefined` for incoming messages in direct conversations
   */
  senderName?: string;
};

function getAttachmentContentType(attachment: Attachment): ChannelPreviewMessageType {
  if (!attachment) return 'text';

  // TODO: add audio (non-voice) content type when supported by the design
  if (attachment.type === 'giphy') return 'giphy';
  if (attachment.type === 'image') return 'image';
  if (attachment.type === 'video') return 'video';
  if (attachment.type === 'voiceRecording') return 'voice';
  if (attachment.type === 'file') return 'file';
  if (attachment.og_scrape_url || attachment.title_link) return 'link';

  return 'file';
}

function getAttachmentFallbackText(
  type: ChannelPreviewMessageType,
  count: number,
  t: TranslationContextValue['t'],
): string {
  switch (type) {
    case 'image':
      return t('imageCount', { count });
    case 'video':
      return t('videoCount', { count });
    case 'voice':
      return t('voiceMessageCount', { count });
    case 'link':
      return t('linkCount', { count });
    case 'file':
    default:
      return t('fileCount', { count });
  }
}

export type UseLatestMessagePreviewParams = {
  /** The channel to generate preview for */
  participantCount?: number;
  /** The latest message in the channel */
  latestMessage?: LocalMessage;
  /**
   * Delivery status from the `useMessageDeliveryStatus` hook.
   * When provided, used to determine the delivery status icon.
   * When omitted, delivery status icons are not shown.
   */
  messageDeliveryStatus?: MessageDeliveryStatus;
};

export const useLatestMessagePreview = ({
  latestMessage,
  messageDeliveryStatus,
  participantCount = Infinity,
}: UseLatestMessagePreviewParams): LatestMessagePreviewData => {
  const { client } = useChatContext('useLatestMessagePreview');
  const { t, userLanguage } = useTranslationContext('useLatestMessagePreview');

  return useMemo(() => {
    if (!latestMessage) {
      return { text: t('Nothing yet...'), type: 'empty' as const };
    }

    if (latestMessage.status === 'failed' || latestMessage.type === 'error') {
      return { text: t('Message failed to send'), type: 'error' as const };
    }

    const isOwnMessage = latestMessage.user?.id === client.user?.id;

    let deliveryStatus: ChannelPreviewDeliveryStatus | undefined;
    if (isOwnMessage) {
      deliveryStatus = messageDeliveryStatus ?? (latestMessage.status as 'sending');
    }

    let senderName: string | undefined;
    if (isOwnMessage) {
      senderName = t('You');
    } else if (!isOwnMessage && participantCount > 2) {
      senderName = latestMessage.user?.name || latestMessage.user?.id;
    }

    if (latestMessage.deleted_at) {
      return {
        deliveryStatus,
        senderName,
        text: t('Message deleted'),
        type: 'deleted' as const,
      };
    }

    if (latestMessage.poll) {
      return {
        deliveryStatus,
        senderName,
        text: t('Poll'),
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
        text: textContent || t('Location'),
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
          ? 'Giphy'
          : // prioritize message text content if available
            textContent ||
            // then fallback text of the single attachment if only one attachment is present and it's not a voice recording (fallback text is generic for voice recordings, so not useful in the preview)
            (attachments.length === 1 && contentType !== 'voice'
              ? firstAttachment.fallback || firstAttachment.title
              : '') ||
            // then generic fallback text based on attachment type and count
            getAttachmentFallbackText(contentType, attachments.length, t);

      // attach duration for audio/video attachments if available
      if (
        contentType !== 'giphy' &&
        attachments.length === 1 &&
        typeof firstAttachment.duration === 'number'
      ) {
        const minutes = Math.floor(firstAttachment.duration / 60);
        const seconds = Math.ceil(firstAttachment.duration) % 60;
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

    return { text: t('Empty message...'), type: 'empty' as const };
  }, [
    client.user?.id,
    latestMessage,
    messageDeliveryStatus,
    participantCount,
    t,
    userLanguage,
  ]);
};
