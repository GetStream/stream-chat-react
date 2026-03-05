import { useMemo } from 'react';
import type { Attachment, Channel, LocalMessage, PollVote } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { getTranslatedMessageText } from '../../../context/MessageTranslationViewContext';
import type { TranslationContextValue } from '../../../context/TranslationContext';
import { MessageDeliveryStatus } from './useMessageDeliveryStatus';

/**
 * The type of content being previewed in the channel list item.
 * Determines which icon to render alongside the preview text.
 *
 * - `text` — Regular text message, no content-type icon
 * - `deleted` — Deleted message, renders ban/circle icon
 * - `error` — Failed message, renders exclamation circle icon
 * - `empty` — No messages yet, no icon
 * - `photo` — Photo attachment, renders camera icon
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
  | 'photo'
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

const getLatestPollVote = (latestVotesByOption: Record<string, PollVote[]>) => {
  let latestVote: PollVote | undefined;
  for (const optionVotes of Object.values(latestVotesByOption)) {
    optionVotes.forEach((vote) => {
      if (latestVote && new Date(latestVote.updated_at) >= new Date(vote.created_at))
        return;
      latestVote = vote;
    });
  }
  return latestVote;
};

function getAttachmentContentType(attachments: Attachment[]): ChannelPreviewMessageType {
  const [first] = attachments;
  if (!first) return 'text';

  if (first.type === 'image' || first.type === 'giphy') return 'photo';
  if (first.type === 'video') return 'video';
  if (first.type === 'voicenote' || first.type === 'audio') return 'voice';
  if (first.type === 'file') return 'file';
  if (first.og_scrape_url || first.title_link) return 'link';

  return 'file';
}

function getAttachmentFallbackText(
  type: ChannelPreviewMessageType,
  t: TranslationContextValue['t'],
): string {
  switch (type) {
    case 'photo':
      return t('Photo');
    case 'video':
      return t('Video');
    case 'voice':
      return t('Voice message');
    case 'file':
      return t('File');
    case 'link':
      return t('Link');
    case 'location':
      return t('Shared location');
    default:
      return t('Attachment');
  }
}

export type UseLatestMessagePreviewParams = {
  /** The channel to generate preview for */
  channel: Channel;
  /** The last message in the channel */
  lastMessage?: LocalMessage;
  /**
   * Delivery status from the `useMessageDeliveryStatus` hook.
   * When provided, used to determine the delivery status icon.
   * When omitted, delivery status icons are not shown.
   */
  messageDeliveryStatus?: MessageDeliveryStatus;
};

/**
 * Hook that produces structured preview data for the channel list item's message row.
 *
 * Given a channel and its last message, returns the preview type, text, delivery status,
 * and sender name that can be used to render appropriate icons and formatted text.
 *
 * @example
 * ```tsx
 * const { type, text, deliveryStatus, senderName } = useLatestMessagePreview({
 *   channel,
 *   lastMessage,
 *   messageDeliveryStatus,
 * });
 * ```
 */
export const useLatestMessagePreview = ({
  channel,
  lastMessage,
  messageDeliveryStatus,
}: UseLatestMessagePreviewParams): LatestMessagePreviewData => {
  const { client } = useChatContext('useLatestMessagePreview');
  const { t, userLanguage } = useTranslationContext('useLatestMessagePreview');

  return useMemo(() => {
    // Empty channel — no messages yet
    if (!lastMessage) {
      return { text: t('Nothing yet...'), type: 'empty' as const };
    }

    // Failed message — error state overrides everything
    if (lastMessage.status === 'failed' || lastMessage.type === 'error') {
      return { text: t('Message failed to send'), type: 'error' as const };
    }

    // Determine ownership
    const isOwnMessage = lastMessage.user?.id === client.user?.id;

    // Compute delivery status for own messages
    let deliveryStatus: ChannelPreviewDeliveryStatus | undefined;
    if (isOwnMessage) {
      if (lastMessage.status === 'sending') {
        deliveryStatus = 'sending';
      } else if (messageDeliveryStatus === MessageDeliveryStatus.READ) {
        deliveryStatus = 'read';
      } else if (messageDeliveryStatus === MessageDeliveryStatus.DELIVERED) {
        deliveryStatus = 'delivered';
      } else if (messageDeliveryStatus === MessageDeliveryStatus.SENT) {
        deliveryStatus = 'sent';
      }
    }

    // Compute sender name prefix
    let senderName: string | undefined;
    if (isOwnMessage) {
      senderName = t('You');
    } else {
      console.log(lastMessage, channel);
      const memberCount = channel.data?.member_count ?? Infinity;
      if (memberCount > 2) {
        senderName = lastMessage.user?.name || lastMessage.user?.id;
      }
    }

    // Deleted message
    if (lastMessage.deleted_at) {
      return {
        deliveryStatus,
        senderName,
        text: t('Message deleted'),
        type: 'deleted' as const,
      };
    }

    // Poll message
    if (lastMessage.poll) {
      const poll = lastMessage.poll;
      let text: string;

      if (!poll.vote_count) {
        const createdBy =
          poll.created_by?.id === client.user?.id
            ? t('You')
            : (poll.created_by?.name ?? t('Poll'));
        text = t('📊 {{createdBy}} created: {{ pollName}}', {
          createdBy,
          pollName: poll.name,
        });
      } else {
        const latestVote = getLatestPollVote(
          poll.latest_votes_by_option as Record<string, PollVote[]>,
        );
        const option =
          latestVote && poll.options.find((opt) => opt.id === latestVote.option_id);

        if (option && latestVote) {
          text = t('📊 {{votedBy}} voted: {{pollOptionText}}', {
            pollOptionText: option.text,
            votedBy:
              latestVote?.user?.id === client.user?.id
                ? t('You')
                : (latestVote.user?.name ?? t('Poll')),
          });
        } else {
          text = `📊 ${poll.name}`;
        }
      }

      return { deliveryStatus, senderName, text, type: 'poll' as const };
    }

    // Get text content (with translation support)
    const textContent =
      getTranslatedMessageText({ language: userLanguage, message: lastMessage }) ||
      lastMessage.text;

    const attachments = lastMessage.attachments;
    const hasAttachments = !!attachments?.length;
    const hasLocation = !!lastMessage.shared_location;

    // Message with text content (may also have attachments — attachment icon + text)
    if (textContent) {
      const type =
        hasAttachments && attachments
          ? getAttachmentContentType(attachments)
          : hasLocation
            ? ('location' as const)
            : ('text' as const);

      return { deliveryStatus, senderName, text: textContent, type };
    }

    // Command
    if (lastMessage.command) {
      return {
        deliveryStatus,
        senderName,
        text: `/${lastMessage.command}`,
        type: 'text' as const,
      };
    }

    // Attachment-only message (no text content)
    if (hasAttachments && attachments) {
      const contentType = getAttachmentContentType(attachments);
      const text = getAttachmentFallbackText(contentType, t);
      return { deliveryStatus, senderName, text, type: contentType };
    }

    // Location-only message
    if (hasLocation) {
      return {
        deliveryStatus,
        senderName,
        text: t('Shared location'),
        type: 'location' as const,
      };
    }

    // Fallback
    return { text: t('Empty message...'), type: 'empty' as const };
  }, [channel, client, lastMessage, messageDeliveryStatus, t, userLanguage]);
};
