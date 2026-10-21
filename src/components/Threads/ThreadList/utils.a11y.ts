import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import type { ChatContextValue } from '../../../context';
import type { TranslationContextValue } from '../../../context/TranslationContext';
import {
  type AccessibleLabelConfig,
  type AccessibleLabelPart,
  activeLabelPart,
  composeAccessibleLabel,
  unreadCountLabelPart,
} from '../../../a11y/accessibleLabel';
import { getDateString } from '../../../i18n/utils';
import { convertTimestampToDate } from 'stream-chat';

/**
 * What the label parts read, gathered by `ThreadListItemUI` from the thread state and contexts.
 */
export type ThreadListItemLabelData = {
  /** Whether the row is the active (currently open) thread. */
  active?: boolean;
  /** The channel the thread belongs to. */
  channel?: Channel;
  client: StreamChat;
  /** The channel's display name (the thread row's title). */
  displayTitle?: string;
  isMessageAIGenerated?: ChatContextValue['isMessageAIGenerated'];
  /** The most recent reply in the thread. */
  latestReply?: LocalMessage;
  /** The thread's parent message; available for custom parts. */
  parentMessage?: LocalMessage;
  /**
   * Display preview text of the parent message, the same string the visible subtitle shows (from
   * `useLatestMessagePreview`). The default `parentMessage` part reads it.
   */
  parentMessagePreview?: string;
  /** Sender prefix of the parent message preview, when the visible preview shows one. */
  parentMessageSender?: string;
  /** Number of participants in the thread. */
  participantCount?: number;
  /** Number of replies in the thread. */
  replyCount?: number;
  t: TranslationContextValue['t'];
  tDateTimeParser: TranslationContextValue['tDateTimeParser'];
  /** The current user's unread reply count for the thread. */
  unreadCount?: number;
  userLanguage?: TranslationContextValue['userLanguage'];
};

/** Produces one segment of the accessible name; return `undefined` or `''` to omit it. */
export type ThreadListItemLabelPart = AccessibleLabelPart<ThreadListItemLabelData>;

/**
 * The default label parts, each overridable via {@link ThreadListItemLabelConfig.parts}. The active
 * state is part of the name because `aria-selected` is not reliably spoken for an option with a
 * custom name; the row keeps `aria-selected` for listbox semantics.
 */
export const defaultThreadListItemLabelParts = {
  active: activeLabelPart,
  name: ({ displayTitle, t }) =>
    displayTitle
      ? t('threadList.chat.ariaLabel', 'Chat: {{ channelName }}', {
          channelName: displayTitle,
        })
      : undefined,
  // Uses the same preview as the row's subtitle.
  parentMessage: ({ parentMessagePreview, parentMessageSender, t }) => {
    if (!parentMessagePreview) return undefined;
    const preview = parentMessageSender
      ? `${parentMessageSender}: ${parentMessagePreview}`
      : parentMessagePreview;
    return t('threadList.thread.ariaLabel', 'Thread: {{ messagePreview }}', {
      messagePreview: preview,
    });
  },
  replyCount: ({ replyCount, t }) =>
    typeof replyCount === 'number' && replyCount > 0
      ? t('common.replyCount.label', {
          count: replyCount,
          defaultValue_one: '1 reply',
          defaultValue_other: '{{ count }} replies',
        })
      : undefined,
  time: ({ latestReply, t, tDateTimeParser }) => {
    const createdAt = latestReply?.created_at;
    if (createdAt == null) return undefined;
    const when = getDateString({
      messageCreatedAt: convertTimestampToDate(createdAt)?.toISOString(),
      t,
      tDateTimeParser,
      timestampTranslationKey: 'timestamp.ChannelPreviewTimestamp',
    });
    return when
      ? t('common.lastActivity.ariaLabel', 'Last activity: {{ time }}', {
          time: String(when),
        })
      : undefined;
  },
  unreadCount: unreadCountLabelPart,
} satisfies Record<string, ThreadListItemLabelPart>;

/** Order in which the default parts are assembled. */
export const DEFAULT_THREAD_LIST_ITEM_LABEL_ORDER = [
  'name',
  'active',
  'unreadCount',
  'parentMessage',
  'replyCount',
  'time',
] as const;

export type ThreadListItemLabelConfig = AccessibleLabelConfig<ThreadListItemLabelData>;

/**
 * Composes the accessible name of a thread list row from named parts, by default in the order of
 * {@link DEFAULT_THREAD_LIST_ITEM_LABEL_ORDER}: name, active, unread count, parent message, reply
 * count, last activity.
 *
 * `ThreadListItemUI` takes an `accessibleLabelConfig` prop, so customizing the label means
 * supplying your own `ThreadListItemUI` through `ComponentContext` and forwarding the config.
 * `parts` merge over {@link defaultThreadListItemLabelParts}: a new key adds a part and a
 * same-named key replaces the default. A part returns its segment, or `undefined` or `''` to be
 * omitted. `order` decides which parts render and in what sequence, so a part missing from it is
 * never rendered. `build` returns the entire string instead. `t` accepts only SDK keys, so a part
 * wraps its own keys in `asDynamicKey` or returns a plain string.
 *
 * ```tsx
 * const accessibleLabelConfig: ThreadListItemLabelConfig = {
 *   parts: {
 *     participants: ({ participantCount }) =>
 *       participantCount ? `${participantCount} participants` : undefined,
 *   },
 *   order: ['name', 'participants', ...DEFAULT_THREAD_LIST_ITEM_LABEL_ORDER.slice(1)],
 * };
 * const MyThreadListItemUI = (props: ThreadListItemUIProps) => (
 *   <ThreadListItemUI {...props} accessibleLabelConfig={accessibleLabelConfig} />
 * );
 * ```
 *
 * @param data - What the label parts read.
 * @param config - Parts, order, separator or `build` overrides.
 * @returns The composed accessible name.
 */
export const composeThreadListItemAccessibleLabel = (
  data: ThreadListItemLabelData,
  config: ThreadListItemLabelConfig = {},
): string =>
  composeAccessibleLabel(
    data,
    defaultThreadListItemLabelParts,
    DEFAULT_THREAD_LIST_ITEM_LABEL_ORDER,
    config,
  );
