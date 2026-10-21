import type { BaseSyntheticEvent } from 'react';
import type { LocalMessage, SortParamRequest, UserResponse } from 'stream-chat';

import type { UserEventHandler } from './hooks';
import type { CustomMentionHandler } from './hooks/useMentionsHandler';
import type { GroupStyle } from '../MessageList/utils';
import type { MessageComposerProps } from '../MessageComposer';
import type { ReactionsComparator } from '../Reactions/types';
import type { MessageContextValue } from '../../context/MessageContext';
import type { RenderTextFunction } from './renderText';

export type ReactEventHandler = (event: React.BaseSyntheticEvent) => Promise<void> | void;

export type MessageProps = {
  /** The message object. */
  message: LocalMessage;
  /**
   * Additional props for the underlying MessageComposer component.
   * See the [available props](https://getstream.io/chat/docs/sdk/react/message-input-components/message_composer/#props).
   */
  additionalMessageComposerProps?: MessageComposerProps;
  /**
   * Keeps the message list scrolled to the bottom when the scroll height grows, e.g. when an
   * element appears below the last message. Only used in the `VirtualizedMessageList`.
   */
  autoscrollToBottom?: () => void;
  /** If true, picking a reaction in the `ReactionSelector` closes the selector. */
  closeReactionSelectorOnClick?: boolean;
  /** Users that have confirmed the message delivery to their device. */
  deliveredTo?: UserResponse[];
  /** If true, users cannot quote messages. Defaults to false. */
  disableQuotedMessages?: boolean;
  // todo: remove
  /** Overrides the date formatting. Receives the original date and returns a string. */
  formatDate?: (date: Date) => string;
  /** Styles to apply to this message, e.g. top, bottom, single. */
  groupStyles?: GroupStyle[];
  /** Whether to highlight the message. The message lists set it on the focused message. */
  highlighted?: boolean;
  /** Whether the message is the thread's parent shown at the top of the thread. */
  initialMessage?: boolean;
  // todo: move to LLC Channel state
  /** Latest own message in the currently displayed message set. */
  lastOwnMessage?: LocalMessage;
  // todo: could be moved to the Channel instance reactive state as lastReceivedMessage keeping the the receipt status as well (useful for channel preview)
  /** ID of the last rendered message with status `received`. */
  lastReceivedId?: string | null;
  /** DOMRect of the parent MessageList wrapper. */
  messageListRect?: DOMRect;
  /** Custom click handler for mentions rendered in the message text. */
  onMentionsClick?: CustomMentionHandler;
  /** Custom hover handler for mentions rendered in the message text. */
  onMentionsHover?: CustomMentionHandler;
  /** Custom function to run on user avatar click. */
  onUserClick?: UserEventHandler;
  /** Custom function to run on user avatar hover. */
  onUserHover?: UserEventHandler;
  /** Custom open-thread handler. Replaces the default ChatView navigation. */
  openThread?: (message: LocalMessage, event: BaseSyntheticEvent) => void;
  /** Sort options for the reactions query. */
  reactionDetailsSort?: SortParamRequest[];
  /**
   * Users that have read this message. Only filled for the last own message unless
   * `returnAllReadData` is set.
   */
  readBy?: UserResponse[];
  /**
   * Which messages use the grid layout with an avatar column. Defaults to `'incoming'`.
   * - `true`: incoming and outgoing messages
   * - `'incoming'`: only messages from other users
   * - `'outgoing'`: only own messages
   * - `false`: none
   */
  showAvatar?: boolean | 'incoming' | 'outgoing';
  /** Custom function to render the message text. Defaults to `renderText`. */
  renderText?: RenderTextFunction;
  /**
   * If true, delivery and read receipts are tracked for every own message, otherwise only for the
   * last one.
   */
  returnAllReadData?: boolean;
  /** Comparator to sort reactions. Defaults to first reaction time, else reaction type. */
  sortReactions?: ReactionsComparator;
  /** If true, the message is rendered inside a thread's reply list. */
  threadList?: boolean;
  /**
   * Renders `message.html` instead of the Markdown text. Posting HTML is only allowed server-side.
   */
  unsafeHTML?: boolean;
};

export type MessageUIComponentProps = Partial<MessageContextValue>;
