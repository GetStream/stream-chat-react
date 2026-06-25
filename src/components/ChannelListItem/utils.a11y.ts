import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import type { ChatContextValue } from '../../context';
import type { TranslationContextValue } from '../../context/TranslationContext';
import { getDateString, isDate } from '../../i18n/utils';
import { MessageDeliveryStatus } from './hooks/useMessageDeliveryStatus';
import { getLatestMessagePreviewText } from './utils';

/**
 * Everything a label part needs. Gathered by `ChannelListItemUI` from its props + contexts and
 * handed to each {@link ChannelListItemLabelPart}.
 */
export type ChannelListItemLabelData = {
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
  /** Whether the row is the selected/active channel. */
  selected?: boolean;
  t: TranslationContextValue['t'];
  tDateTimeParser: TranslationContextValue['tDateTimeParser'];
  /** Unread count for the channel. */
  unreadCount?: number;
  userLanguage?: TranslationContextValue['userLanguage'];
};

/** Produces one segment of the accessible name; return `undefined`/empty to omit it. */
export type ChannelListItemLabelPart = (
  data: ChannelListItemLabelData,
) => string | undefined;

/**
 * The default, named label parts. Each is independently overridable via
 * {@link ChannelListItemLabelConfig.parts}. Selected state is intentionally NOT a part — it is
 * conveyed by the row's `aria-selected`, so duplicating it here would double-announce it.
 */
export const defaultChannelListItemLabelParts = {
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
  unreadCount: ({ t, unreadCount }) =>
    typeof unreadCount === 'number' && unreadCount > 0
      ? t('aria/{{ count }} unread message', { count: unreadCount })
      : undefined,
} satisfies Record<string, ChannelListItemLabelPart>;

/** Default order the parts are assembled in (reading order). */
export const DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER = [
  'name',
  'unreadCount',
  'lastMessage',
  'deliveryStatus',
  'time',
] as const;

export type ChannelListItemLabelConfig = {
  /** Full override — return the entire label; ignores `order`/`parts`/`separator`. */
  build?: (data: ChannelListItemLabelData) => string;
  /** Which parts to include, in what order. Defaults to {@link DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER}. */
  order?: ReadonlyArray<string>;
  /** Override or add individual part generators; merged over {@link defaultChannelListItemLabelParts}. */
  parts?: Record<string, ChannelListItemLabelPart>;
  /** Joiner between non-empty parts. Defaults to ". ". */
  separator?: string;
};

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
 * - Each part receives {@link ChannelListItemLabelData}. `selected`/`unreadCount`/
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
): string => {
  if (config.build) return config.build(data);
  const parts: Record<string, ChannelListItemLabelPart> = {
    ...defaultChannelListItemLabelParts,
    ...config.parts,
  };
  const order = config.order ?? DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER;
  return order
    .map((key) => parts[key]?.(data))
    .filter((value): value is string => !!value)
    .join(config.separator ?? '. ');
};
