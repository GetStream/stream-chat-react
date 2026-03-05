import { useMemo } from 'react';
import type { Attachment, LocalMessage } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { getTranslatedMessageText } from '../../../context/MessageTranslationViewContext';
import type { TranslationContextValue } from '../../../context/TranslationContext';
import type { MessageDeliveryStatus } from './useMessageDeliveryStatus';

/**
 * The type of content being previewed in the channel list item.
 * Determines which icon to render alongside the preview text.
 *
 * - `text` — Regular text message, no content-type icon
 * - `deleted` — Deleted message, renders ban/circle icon
 * - `error` — Failed message, renders exclamation circle icon
 * - `empty` — No messages yet, no icon
 * - `image` — Image attachment, renders camera icon
 * - `video` — Video attachment, renders video icon
 * - `voice` — Voice message, renders microphone icon
 * - `file` — File attachment, renders file icon
 * - `link` — Link preview, renders chain link icon
 * - `location` — Shared location, renders map pin icon
 * - `poll` — Poll message, emoji prefix in text
 */
export type ChannelPreviewMessageType =
  | 'text'
  | 'deleted'
  | 'error'
  | 'empty'
  | 'image'
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

/**
 * Structured data for rendering the channel preview message row.
 * Produced by the `useLatestMessagePreview` hook.
 */
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

function getAttachmentContentType(attachments: Attachment[]): ChannelPreviewMessageType {
  const [first] = attachments;
  if (!first) return 'text';

  if (first.type === 'image' || first.type === 'giphy') return 'image';
  if (first.type === 'video') return 'video';
  if (first.type === 'voiceRecording') return 'voice';
  if (first.type === 'file') return 'file';
  if (first.og_scrape_url || first.title_link) return 'link';

  return 'file';
}

function getAttachmentFallbackText(
  type: ChannelPreviewMessageType,
  t: TranslationContextValue['t'],
): string {
  switch (type) {
    case 'image':
      return t('Image');
    case 'video':
      return t('Video');
    case 'voice':
      return t('Voice message');
    case 'link':
      return t('Link');
    case 'file':
    default:
      return t('File');
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
      let text: string;

      if (attachments.length === 1) {
        contentType = getAttachmentContentType(attachments);
        text = textContent || getAttachmentFallbackText(contentType, t);
      } else {
        contentType = 'file';
        text = textContent || t('fileCount', { count: attachments.length });
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
