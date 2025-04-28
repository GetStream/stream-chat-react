import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import type { ReactionSort, UserResponse } from 'stream-chat';

import type { PinPermissions, UserEventHandler } from './hooks';
import type { MessageActionsArray } from './utils';

import type { LocalMessage } from 'stream-chat';
import type { GroupStyle } from '../MessageList/utils';
import type { MessageInputProps } from '../MessageInput/MessageInput';
import type { ReactionDetailsComparator, ReactionsComparator } from '../Reactions/types';
import type { ChannelActionContextValue } from '../../context/ChannelActionContext';
import type { ComponentContextValue } from '../../context/ComponentContext';
import type { MessageContextValue } from '../../context/MessageContext';
import type { RenderTextOptions } from './renderText';

export type ReactEventHandler = (event: React.BaseSyntheticEvent) => Promise<void> | void;

export type MessageProps = {
  /** The message object */
  message: LocalMessage;
  /** Additional props for underlying MessageInput component, [available props](https://getstream.io/chat/docs/sdk/react/message-input-components/message_input/#props) */
  additionalMessageInputProps?: MessageInputProps;
  /** Call this function to keep message list scrolled to the bottom when the scroll height increases, e.g. an element appears below the last message (only used in the `VirtualizedMessageList`) */
  autoscrollToBottom?: () => void;
  /** If true, picking a reaction from the `ReactionSelector` component will close the selector */
  closeReactionSelectorOnClick?: boolean;
  /** Object containing custom message actions and function handlers */
  customMessageActions?: MessageContextValue['customMessageActions'];
  /** If true, disables the ability for users to quote messages, defaults to false */
  disableQuotedMessages?: boolean;
  /** When true, the message is the last one in a group sent by a specific user (only used in the `VirtualizedMessageList`) */
  endOfGroup?: boolean;
  /** When true, the message is the first one in a group sent by a specific user (only used in the `VirtualizedMessageList`) */
  firstOfGroup?: boolean;
  /** Override the default formatting of the date. This is a function that has access to the original date object, returns a string  */
  formatDate?: (date: Date) => string;
  /** Function that returns the notification text to be displayed when a delete message request fails */
  getDeleteMessageErrorNotification?: (message: LocalMessage) => string;
  /** Function that returns the notification text to be displayed when loading message reactions fails */
  getFetchReactionsErrorNotification?: (message: LocalMessage) => string;
  /** Function that returns the notification text to be displayed when a flag message request fails */
  getFlagMessageErrorNotification?: (message: LocalMessage) => string;
  /** Function that returns the notification text to be displayed when a flag message request succeeds */
  getFlagMessageSuccessNotification?: (message: LocalMessage) => string;
  /** Function that returns the notification text to be displayed when mark channel messages unread request fails */
  getMarkMessageUnreadErrorNotification?: (message: LocalMessage) => string;
  /** Function that returns the notification text to be displayed when mark channel messages unread request succeeds */
  getMarkMessageUnreadSuccessNotification?: (message: LocalMessage) => string;
  /** Function that returns the notification text to be displayed when a mute user request fails */
  getMuteUserErrorNotification?: (user: UserResponse) => string;
  /** Function that returns the notification text to be displayed when a mute user request succeeds */
  getMuteUserSuccessNotification?: (user: UserResponse) => string;
  /** Function that returns the notification text to be displayed when a pin message request fails */
  getPinMessageErrorNotification?: (message: LocalMessage) => string;
  /** If true, group messages sent by each user (only used in the `VirtualizedMessageList`) */
  groupedByUser?: boolean;
  /** A list of styles to apply to this message, i.e. top, bottom, single */
  groupStyles?: GroupStyle[];
  /** Whether to highlight and focus the message on load */
  highlighted?: boolean;
  /** Whether the threaded message is the first in the thread list */
  initialMessage?: boolean;
  /** Latest message id on current channel */
  lastReceivedId?: string | null;
  /** UI component to display a Message in MessageList, overrides value in [ComponentContext](https://getstream.io/chat/docs/sdk/react/contexts/component_context/#message) */
  Message?: ComponentContextValue['Message'];
  /** Array of allowed message actions (ex: ['edit', 'delete', 'flag', 'mute', 'pin', 'quote', 'react', 'reply']). To disable all actions, provide an empty array. */
  messageActions?: MessageActionsArray;
  /** DOMRect object for parent MessageList component */
  messageListRect?: DOMRect;
  /** If true, only the sender of the message has editing privileges */
  onlySenderCanEdit?: boolean;
  /** Custom mention click handler to override default in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  onMentionsClick?: ChannelActionContextValue['onMentionsClick'];
  /** Custom mention hover handler to override default in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  onMentionsHover?: ChannelActionContextValue['onMentionsHover'];
  /** Custom function to run on user avatar click */
  onUserClick?: UserEventHandler;
  /** Custom function to run on user avatar hover */
  onUserHover?: UserEventHandler;
  /** Custom open thread handler to override default in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  openThread?: ChannelActionContextValue['openThread'];
  /** @deprecated in favor of `channelCapabilities - The user roles allowed to pin messages in various channel types */
  pinPermissions?: PinPermissions;
  /** Sort options to provide to a reactions query */
  reactionDetailsSort?: ReactionSort;
  /** A list of users that have read this Message if the message is the last one and was posted by my user */
  readBy?: UserResponse[];
  /** Custom function to render message text content, defaults to the renderText function: [utils](https://github.com/GetStream/stream-chat-react/blob/master/src/utils.ts) */
  renderText?: (
    text?: string,
    mentioned_users?: UserResponse[],
    options?: RenderTextOptions,
  ) => ReactNode;
  /** Custom retry send message handler to override default in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  retrySendMessage?: ChannelActionContextValue['retrySendMessage'];
  /** Comparator function to sort the list of reacted users
   * @deprecated use `reactionDetailsSort` instead
   */
  sortReactionDetails?: ReactionDetailsComparator;
  /** Comparator function to sort reactions, defaults to chronological order */
  sortReactions?: ReactionsComparator;
  /** Whether the Message is in a Thread */
  threadList?: boolean;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
};

export type MessageUIComponentProps = Partial<MessageContextValue>;

export type PinIndicatorProps = {
  message?: LocalMessage;
  t?: TFunction;
};
