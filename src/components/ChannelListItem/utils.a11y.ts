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
import { getDateString, isDate } from '../../i18n/utils';
import { MessageDeliveryStatus } from './hooks/useMessageDeliveryStatus';
import { getLatestMessagePreviewText } from './utils';

/**
 * Everything a label part needs. Gathered by `ChannelListItemUI` from its props + contexts and
 * handed to each {@link ChannelListItemLabelPart}.
 */
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
   * The channel's latest message. Convenience for parts (and to avoid re-deriving it); when
   * omitted, parts fall back to `channel.state.latestMessages`.
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
 * The default, named label parts. Each is independently overridable via
 * {@link ChannelListItemLabelConfig.parts}. The active (currently open) state is announced here (not
 * left to the row's `aria-selected` alone, which is not reliably spoken across screen readers for an
 * option with a custom name); `aria-selected` is kept on the active row for listbox semantics.
 */
export const defaultChannelListItemLabelParts = {
  active: activeLabelPart,
  // Announced alongside the last message text: the number of attachments. Link previews are
  // excluded (the linkPreview part announces those). A single attachment with no text is skipped
  // here because the lastMessage part already conveys it as "Attachment <type>".
  attachments: ({ channel, latestMessage, t }) => {
    const message =
      latestMessage ??
      channel.state.latestMessages[channel.state.latestMessages.length - 1];
    const count =
      message?.attachments?.filter((attachment) => !attachment.og_scrape_url).length ?? 0;
    if (count === 0 || (count === 1 && !message?.text)) return undefined;
    return t('aria/{{ count }} attachment', { count });
  },
  deliveryStatus: ({ messageDeliveryStatus, t }) => {
    if (!messageDeliveryStatus) return undefined;
    const statusLabelByStatus: Record<MessageDeliveryStatus, string> = {
      [MessageDeliveryStatus.SENT]: t('aria/Sent'),
      [MessageDeliveryStatus.DELIVERED]: t('aria/Delivered'),
      [MessageDeliveryStatus.READ]: t('aria/Read'),
    };
    return t('aria/Delivery status: {{ deliveryStatus }}', {
      deliveryStatus: statusLabelByStatus[messageDeliveryStatus],
    });
  },
  lastMessage: ({
    channel,
    client,
    isMessageAIGenerated,
    latestMessage,
    t,
    userLanguage,
  }) => {
    const message =
      latestMessage ??
      channel.state.latestMessages[channel.state.latestMessages.length - 1];
    const preview = getLatestMessagePreviewText(
      channel,
      t,
      userLanguage,
      isMessageAIGenerated,
      // Keep the announced preview text consistent with the sender/status/time derived from the
      // same message (falls back to the channel's latest when not supplied).
      latestMessage,
    );
    // Empty channel: announce there are no messages ("Nothing yet...").
    if (!message) return preview;
    const isOwn = !!client.userID && message.user?.id === client.userID;
    // Use the sender's name (or "You" for the current user). When the name is unknown we omit the
    // sender rather than reading out a raw user id.
    const sender = isOwn ? t('You') : message.user?.name;
    return sender
      ? t('aria/Last message from {{ sender }}: {{ messagePreview }}', {
          messagePreview: preview,
          sender,
        })
      : t('aria/Last message: {{ messagePreview }}', { messagePreview: preview });
  },
  linkPreview: ({ channel, latestMessage, t }) => {
    const message =
      latestMessage ??
      channel.state.latestMessages[channel.state.latestMessages.length - 1];
    const link = message?.attachments?.find((attachment) => attachment.og_scrape_url);
    if (!link) return undefined;
    return link.title
      ? t('aria/Shared a link with title: {{ linkTitle }}', { linkTitle: link.title })
      : t('aria/Shared a link');
  },
  name: ({ displayTitle }) => displayTitle || undefined,
  time: ({ channel, latestMessage, t, tDateTimeParser }) => {
    const createdAt = (
      latestMessage ??
      channel.state.latestMessages[channel.state.latestMessages.length - 1]
    )?.created_at;
    if (!createdAt || !isDate(createdAt)) return undefined;
    const when = getDateString({
      messageCreatedAt: createdAt.toISOString(),
      t,
      tDateTimeParser,
      timestampTranslationKey: 'timestamp/ChannelPreviewTimestamp',
    });
    // Prefix the time so it is clearly its own segment (not read as part of the preceding
    // delivery-status segment).
    return when ? t('aria/Last activity: {{ time }}', { time: String(when) }) : undefined;
  },
  unreadCount: unreadCountLabelPart,
} satisfies Record<string, ChannelListItemLabelPart>;

/** Default order the parts are assembled in (reading order). */
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
 * Composes a single, coherent accessible name for a channel list row from named parts. The default
 * reading order is name → unread → last message (sender + preview) → delivery status → time.
 *
 * ## Customizing the label
 *
 * The label is generated by `ChannelListItemUI`, which accepts an `accessibleLabelConfig` prop. To
 * customize it, supply your own `ChannelListItemUI` through `ComponentContext` (the same way the
 * component is overridden) and forward the config — no new plumbing:
 *
 * ```tsx
 * const MyChannelPreview = (props) => (
 *   <DefaultChannelListItemUI {...props} accessibleLabelConfig={accessibleLabelConfig} />
 * );
 * // <ComponentProvider value={{ ChannelListItemUI: MyChannelPreview }}> … </ComponentProvider>
 * ```
 *
 * ### Adding custom parts (e.g. Pinned, Muted, Frozen)
 *
 * - {@link ChannelListItemLabelConfig.parts} is merged over {@link defaultChannelListItemLabelParts},
 *   so a new key is *added* and a same-named key *overrides* the default.
 * - A part returns its segment string, or `undefined`/`''` to be omitted (so e.g. "Pinned" is only
 *   spoken when actually pinned).
 * - {@link ChannelListItemLabelConfig.order} decides which parts are included AND their sequence —
 *   **a part not listed in `order` is never rendered**, even if defined. Spread
 *   {@link DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER} to keep the defaults and insert your own.
 * - Each part receives {@link ChannelListItemLabelData}. `active`/`unreadCount`/
 *   `messageDeliveryStatus`/`latestMessage` are passed directly; everything else (mute/pin state,
 *   `frozen`, member count, custom `channel.data`) is read off `channel`. Parts call `t`, so provide
 *   your own i18n keys (or return plain strings) — the SDK does not ship `Pinned`/`Muted`/`Frozen`
 *   strings.
 *
 * ```tsx
 * const accessibleLabelConfig: ChannelListItemLabelConfig = {
 *   parts: {
 *     pinned: ({ channel, t }) => (channel.state.membership?.pinned_at ? t('Pinned') : undefined),
 *     muted: ({ channel, t }) => (channel.muteStatus().muted ? t('Muted') : undefined),
 *     frozen: ({ channel, t }) => (channel.data?.frozen ? t('Frozen') : undefined),
 *   },
 *   order: ['name', 'pinned', 'muted', 'frozen', ...DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER.slice(1)],
 * };
 * // → "General. Pinned. Muted. 3 unread messages. Last message from Alice: hi. 2 days ago"
 * ```
 *
 * For full control, set {@link ChannelListItemLabelConfig.build} (return the entire string), or
 * write a custom `ChannelListItemUI` that calls this function directly — importing
 * {@link defaultChannelListItemLabelParts} to reuse the built-ins.
 */
export const composeChannelListItemAccessibleLabel = (
  data: ChannelListItemLabelData,
  config: ChannelListItemLabelConfig = {},
): string =>
  composeAccessibleLabel(
    data,
    defaultChannelListItemLabelParts,
    DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER,
    config,
  );
