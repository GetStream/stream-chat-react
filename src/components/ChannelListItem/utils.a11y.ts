import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import type { ChatContextValue } from '../../context';
import type { TranslationContextValue } from '../../context/TranslationContext';
import {
  type AccessibleLabelConfig,
  type AccessibleLabelPart,
  activeLabelPart,
  composeAccessibleLabel,
  unreadCountLabelPart,
} from '../../a11y/accessibleLabel';
import { getDateString } from '../../i18n/utils';
import { MessageDeliveryStatus } from './hooks/useMessageDeliveryStatus';
import { getLatestMessagePreviewText } from './utils';
import { convertTimestampToDate } from 'stream-chat';

/** Data `ChannelListItemUI` gathers from its props and contexts for each label part. */
export type ChannelListItemLabelData = {
  /** Whether the row is the active (currently open) channel. */
  active?: boolean;
  /** The channel whose latest message is summarized. */
  channel: Channel;
  /** Client, used to detect whether the latest message is the current user's own. */
  client: StreamChat;
  /** Channel display name. */
  displayTitle?: string;
  isMessageAIGenerated?: ChatContextValue['isMessageAIGenerated'];
  /**
   * The channel's latest message. When omitted, {@link composeChannelListItemAccessibleLabel} uses
   * the `latestMessage` of `channel.messagePaginator.aggregateState`, so every part describes the
   * same message.
   */
  latestMessage?: LocalMessage;
  /** Delivery/read status of the latest message when it is the current user's own. */
  messageDeliveryStatus?: MessageDeliveryStatus;
  t: TranslationContextValue['t'];
  tDateTimeParser: TranslationContextValue['tDateTimeParser'];
  /** Unread count for the channel. */
  unreadCount?: number;
  userLanguage?: TranslationContextValue['userLanguage'];
};

/** Produces one segment of the accessible name; return `undefined`/empty to omit it. */
export type ChannelListItemLabelPart = AccessibleLabelPart<ChannelListItemLabelData>;

/**
 * The default label parts, each overridable via {@link ChannelListItemLabelConfig.parts}. The
 * active state is announced by a part because `aria-selected` alone is not reliably spoken for an
 * option with a custom name.
 */
export const defaultChannelListItemLabelParts = {
  active: activeLabelPart,
  // Link previews are excluded (the `linkPreview` part announces those). A single attachment with
  // no text is skipped because the `lastMessage` part already announces its type.
  attachments: ({ latestMessage, t }) => {
    const count =
      latestMessage?.attachments?.filter((attachment) => !attachment.og_scrape_url)
        .length ?? 0;
    if (count === 0 || (count === 1 && !latestMessage?.text)) return undefined;
    return t('channelListItem.attachmentCount.ariaLabel', {
      count,
      defaultValue_one: '{{ count }} attachment',
      defaultValue_other: '{{ count }} attachments',
    });
  },
  deliveryStatus: ({ messageDeliveryStatus, t }) => {
    if (!messageDeliveryStatus) return undefined;
    const statusLabelByStatus: Record<MessageDeliveryStatus, string> = {
      [MessageDeliveryStatus.SENT]: t('channelListItem.sent.ariaLabel', 'Sent'),
      [MessageDeliveryStatus.DELIVERED]: t(
        'channelListItem.delivered.ariaLabel',
        'Delivered',
      ),
      [MessageDeliveryStatus.READ]: t('channelListItem.read.ariaLabel', 'Read'),
    };
    return t(
      'channelListItem.deliveryStatus.ariaLabel',
      'Delivery status: {{ deliveryStatus }}',
      {
        deliveryStatus: statusLabelByStatus[messageDeliveryStatus],
      },
    );
  },
  lastMessage: ({
    channel,
    client,
    isMessageAIGenerated,
    latestMessage,
    t,
    userLanguage,
  }) => {
    const preview = getLatestMessagePreviewText(
      channel,
      t,
      userLanguage,
      isMessageAIGenerated,
      // Pre-resolved by the composer, so the preview describes the same message as the other parts.
      latestMessage,
    );
    // Empty channel: there is no sender to name.
    if (!latestMessage) return preview;
    const isOwn = !!client.userID && latestMessage.user?.id === client.userID;
    // "You" for the current user; an unknown name is omitted rather than reading out a user ID.
    const sender = isOwn ? t('common.you.label', 'You') : latestMessage.user?.name;
    return sender
      ? t(
          'channelListItem.lastMessage.withSenderAndMessagePreview.ariaLabel',
          'Last message from {{ sender }}: {{ messagePreview }}',
          {
            messagePreview: preview,
            sender,
          },
        )
      : t(
          'channelListItem.lastMessage.withMessagePreview.ariaLabel',
          'Last message: {{ messagePreview }}',
          { messagePreview: preview },
        );
  },
  linkPreview: ({ latestMessage, t }) => {
    const link = latestMessage?.attachments?.find(
      (attachment) => attachment.og_scrape_url,
    );
    if (!link) return undefined;
    return link.title
      ? t(
          'channelListItem.sharedLinkTitle.ariaLabel',
          'Shared a link with title: {{ linkTitle }}',
          { linkTitle: link.title },
        )
      : t('channelListItem.sharedLink.ariaLabel', 'Shared a link');
  },
  name: ({ displayTitle }) => displayTitle || undefined,
  time: ({ latestMessage, t, tDateTimeParser }) => {
    const createdAt = latestMessage?.created_at;
    if (createdAt == null) return undefined;
    const when = getDateString({
      messageCreatedAt: convertTimestampToDate(createdAt)?.toISOString(),
      t,
      tDateTimeParser,
      timestampTranslationKey: 'timestamp.ChannelPreviewTimestamp',
    });
    // The prefix keeps the time from being read as part of the delivery status.
    return when
      ? t('common.lastActivity.ariaLabel', 'Last activity: {{ time }}', {
          time: String(when),
        })
      : undefined;
  },
  unreadCount: unreadCountLabelPart,
} satisfies Record<string, ChannelListItemLabelPart>;

/** Default order of the parts in the composed label. */
export const DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER = [
  'name',
  'active',
  'unreadCount',
  'lastMessage',
  'attachments',
  'linkPreview',
  'deliveryStatus',
  'time',
] as const;

export type ChannelListItemLabelConfig = AccessibleLabelConfig<ChannelListItemLabelData>;

/**
 * Composes a channel list row's accessible name from named parts, by default in the order of
 * {@link DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER}.
 *
 * `ChannelListItemUI` calls this with its `accessibleLabelConfig` prop. To customize the label,
 * supply your own `ChannelListItemUI` through `ComponentContext` and forward the config:
 * {@link ChannelListItemLabelConfig.parts} is merged over {@link defaultChannelListItemLabelParts}
 * (a new key is added, a same-named key replaces the default), and
 * {@link ChannelListItemLabelConfig.order} decides which parts render and in what sequence, so a
 * part missing from it is never rendered. A part returns its segment, or `undefined`/`''` to omit
 * it. Set {@link ChannelListItemLabelConfig.build} to return the whole string instead.
 *
 * Parts receive {@link ChannelListItemLabelData}; anything else (mute or pin state, `frozen`,
 * custom `channel.data`) is read off `channel`. `t` accepts only {@link TranslationKey}s, so wrap
 * your own keys in {@link asDynamicKey} and pass the English copy as the second argument.
 *
 * ```tsx
 * const accessibleLabelConfig: ChannelListItemLabelConfig = {
 *   parts: {
 *     pinned: ({ channel, t }) =>
 *       channel.state.membership?.pinned_at
 *         ? t(asDynamicKey('myApp.channelList.pinned'), 'Pinned')
 *         : undefined,
 *   },
 *   order: ['name', 'pinned', ...DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER.slice(1)],
 * };
 * // "General. Pinned. 3 unread messages. Last message from Alice: hi. 2 days ago"
 * ```
 *
 * @param data - Data for the label parts.
 * @param config - Overrides for the parts, their order, the separator, or the whole label.
 * @returns The non-empty segments joined by the separator, or the result of `config.build`.
 */
export const composeChannelListItemAccessibleLabel = (
  data: ChannelListItemLabelData,
  config: ChannelListItemLabelConfig = {},
): string =>
  composeAccessibleLabel(
    // Resolved once so every part describes the same message.
    {
      ...data,
      latestMessage:
        data.latestMessage ??
        data.channel.messagePaginator.aggregateState.getLatestValue().latestMessage ??
        undefined,
    },
    defaultChannelListItemLabelParts,
    DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER,
    config,
  );
