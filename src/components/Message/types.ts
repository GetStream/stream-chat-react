import type { TFunction } from 'i18next';
import type { UserResponse } from 'stream-chat';

import type { PinPermissions, UserEventHandler } from './hooks';
import type { MessageActionsArray } from './utils';

import type { GroupStyle } from '../MessageList/utils';
import type { MessageInputProps } from '../MessageInput/MessageInput';

import type { ChannelActionContextValue } from '../../context/ChannelActionContext';
import type { StreamMessage } from '../../context/ChannelStateContext';
import type { ComponentContextValue } from '../../context/ComponentContext';
import type { MessageContextValue } from '../../context/MessageContext';
import type { RenderTextOptions } from '../../utils';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../types/types';

export type ReactEventHandler = (event: React.BaseSyntheticEvent) => Promise<void> | void;

export type MessageProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = {
  /** The message object */
  message: StreamMessage<StreamChatGenerics>;
  /** Additional props for underlying MessageInput component, [available props](https://getstream.io/chat/docs/sdk/react/message-input-components/message_input/#props) */
  additionalMessageInputProps?: MessageInputProps<StreamChatGenerics, V>;
  /** Call this function to keep message list scrolled to the bottom when the scroll height increases, e.g. an element appears below the last message (only used in the `VirtualizedMessageList`) */
  autoscrollToBottom?: () => void;
  /** If true, picking a reaction from the `ReactionSelector` component will close the selector */
  closeReactionSelectorOnClick?: boolean;
  /** Object containing custom message actions and function handlers */
  customMessageActions?: MessageContextValue<StreamChatGenerics>['customMessageActions'];
  /** If true, disables the ability for users to quote messages, defaults to false */
  disableQuotedMessages?: boolean;
  /** When true, the message is the last one in a group sent by a specific user (only used in the `VirtualizedMessageList`) */
  endOfGroup?: boolean;
  /** When true, the message is the first one in a group sent by a specific user (only used in the `VirtualizedMessageList`) */
  firstOfGroup?: boolean;
  /** Override the default formatting of the date. This is a function that has access to the original date object, returns a string  */
  formatDate?: (date: Date) => string;
  /** Function that returns the notification text to be displayed when a delete message request fails */
  getDeleteMessageErrorNotification?: (message: StreamMessage<StreamChatGenerics>) => string;
  /** Function that returns the notification text to be displayed when a flag message request fails */
  getFlagMessageErrorNotification?: (message: StreamMessage<StreamChatGenerics>) => string;
  /** Function that returns the notification text to be displayed when a flag message request succeeds */
  getFlagMessageSuccessNotification?: (message: StreamMessage<StreamChatGenerics>) => string;
  /** Function that returns the notification text to be displayed when a mute user request fails */
  getMuteUserErrorNotification?: (user: UserResponse<StreamChatGenerics>) => string;
  /** Function that returns the notification text to be displayed when a mute user request succeeds */
  getMuteUserSuccessNotification?: (user: UserResponse<StreamChatGenerics>) => string;
  /** Function that returns the notification text to be displayed when a pin message request fails */
  getPinMessageErrorNotification?: (message: StreamMessage<StreamChatGenerics>) => string;
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
  Message?: ComponentContextValue<StreamChatGenerics>['Message'];
  /** Array of allowed message actions (ex: ['edit', 'delete', 'flag', 'mute', 'pin', 'quote', 'react', 'reply']). To disable all actions, provide an empty array. */
  messageActions?: MessageActionsArray;
  /** DOMRect object for parent MessageList component */
  messageListRect?: DOMRect;
  /** If true, only the sender of the message has editing privileges */
  onlySenderCanEdit?: boolean;
  /** Custom mention click handler to override default in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  onMentionsClick?: ChannelActionContextValue<StreamChatGenerics>['onMentionsClick'];
  /** Custom mention hover handler to override default in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  onMentionsHover?: ChannelActionContextValue<StreamChatGenerics>['onMentionsHover'];
  /** Custom function to run on user avatar click */
  onUserClick?: UserEventHandler<StreamChatGenerics>;
  /** Custom function to run on user avatar hover */
  onUserHover?: UserEventHandler<StreamChatGenerics>;
  /** Custom open thread handler to override default in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  openThread?: ChannelActionContextValue<StreamChatGenerics>['openThread'];
  /** @deprecated in favor of `channelCapabilities - The user roles allowed to pin messages in various channel types */
  pinPermissions?: PinPermissions;
  /** A list of users that have read this Message */
  readBy?: UserResponse<StreamChatGenerics>[];
  /** Custom function to render message text content, defaults to the renderText function: [utils](https://github.com/GetStream/stream-chat-react/blob/master/src/utils.ts) */
  renderText?: (
    text?: string,
    mentioned_users?: UserResponse<StreamChatGenerics>[],
    options?: RenderTextOptions,
  ) => JSX.Element | null;
  /** Custom retry send message handler to override default in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  retrySendMessage?: ChannelActionContextValue<StreamChatGenerics>['retrySendMessage'];
  /** Whether the Message is in a Thread */
  threadList?: boolean;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
};

export type MessageUIComponentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Partial<MessageContextValue<StreamChatGenerics>>;

export type PinIndicatorProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  message?: StreamMessage<StreamChatGenerics>;
  t?: TFunction;
};
