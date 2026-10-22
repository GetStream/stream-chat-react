import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';

import type {
  DeleteMessageOptions,
  LocalMessage,
  ReactionResponse,
  SortParamRequest,
  UserResponse,
} from 'stream-chat';

import type { ActionHandlerReturnType } from '../components/Message/hooks/useActionHandler';
import type { ReactEventHandler } from '../components/Message/types';
import type { GroupStyle } from '../components/MessageList/utils';
import type { ReactionsComparator, ReactionType } from '../components/Reactions/types';

import type { RenderTextFunction } from '../components/Message/renderText';
import { requireContext } from './requireContext';

export type MessageContextValue = {
  /** Sends a message action. A returned message is ingested; otherwise the local one is removed. */
  handleAction: ActionHandlerReturnType;
  handleDelete: (options?: DeleteMessageOptions) => Promise<void> | void;
  /** Fetches the message reactions, optionally of one type and sorted. */
  handleFetchReactions: (
    reactionType?: ReactionType,
    sort?: SortParamRequest[],
  ) => Promise<Array<ReactionResponse>>;
  handleFlag: ReactEventHandler;
  /** Marks the message and the messages that follow it as unread. */
  handleMarkUnread: ReactEventHandler;
  handleMute: ReactEventHandler;
  /** Opens the message's thread: the `openThread` prop of `Message`, else ChatView navigation. */
  handleOpenThread: ReactEventHandler;
  handlePin: ReactEventHandler;
  handleReaction: (
    reactionType: string,
    event: React.BaseSyntheticEvent,
  ) => Promise<void>;
  handleRetry: (message: LocalMessage) => Promise<void> | void;
  isMyMessage: () => boolean;
  message: LocalMessage;
  /** Click handler for an @mention in the message. */
  onMentionsClickMessage: ReactEventHandler;
  /** Hover handler for an @mention in the message. */
  onMentionsHoverMessage: ReactEventHandler;
  /** Click handler for the user who posted the message. */
  onUserClick: ReactEventHandler;
  /** Hover handler for the user who posted the message. */
  onUserHover: ReactEventHandler;
  /**
   * Keeps the message list scrolled to the bottom when the scroll height grows, e.g. when an
   * element appears below the last message. Only used in the `VirtualizedMessageList`.
   */
  autoscrollToBottom?: () => void;
  /** If true, picking a reaction in the `ReactionSelector` closes the selector. */
  closeReactionSelectorOnClick?: boolean;
  /** Users that have confirmed the message delivery to their device. */
  deliveredTo?: UserResponse[];
  /** If true, the message ends a group from one user (adds `virtual-message__wrapper--end`). */
  endOfGroup?: boolean;
  /** If true, the message starts a group from one user (adds `virtual-message__wrapper--first`). */
  firstOfGroup?: boolean;
  /** Overrides the date formatting. Receives the original date and returns a string. */
  formatDate?: (date: Date) => string;
  /** If true, messages from one user are grouped, with metadata only on the last of a group. */
  groupedByUser?: boolean;
  /** Styles to apply to this message, e.g. top, bottom, single. */
  groupStyles?: GroupStyle[];
  /** Whether to highlight the message. The message lists set it on the focused message. */
  highlighted?: boolean;
  /** Whether the message is the thread's parent shown at the top of the thread. */
  initialMessage?: boolean;
  /** Whether a message is AI generated. */
  isMessageAIGenerated?: (message: LocalMessage) => boolean;
  /** Latest own message in the currently displayed message set. */
  lastOwnMessage?: LocalMessage;
  /** ID of the last rendered message with status `received`. */
  lastReceivedId?: string | null;
  /** DOMRect of the parent MessageList wrapper. */
  messageListRect?: DOMRect;
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
  /** Comparator to sort reactions. Defaults to first reaction time if both have one, else type. */
  sortReactions?: ReactionsComparator;
  /** If true, the message is rendered inside a thread's reply list. */
  threadList?: boolean;
  /**
   * Renders `message.html` instead of the Markdown text. Posting HTML is allowed server-side only.
   */
  unsafeHTML?: boolean;
  /**
   * Which text a translated message shows, for this user only: `'original'` is `message.text`,
   * `'translated'` is the translation for the user language, falling back to `message.text`.
   */
  translationView?: 'original' | 'translated';
  /** Sets whether this message shows the original or translated text, for this user only. */
  setTranslationView?: (view: 'original' | 'translated') => void;
};

export const MessageContext = React.createContext<MessageContextValue | undefined>(
  undefined,
);

export const MessageProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: MessageContextValue;
}>) => (
  <MessageContext.Provider value={value as unknown as MessageContextValue}>
    {children}
  </MessageContext.Provider>
);

export const useMessageContext = () =>
  requireContext(useContext(MessageContext), 'useMessageContext', 'MessageProvider');
