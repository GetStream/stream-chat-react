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

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type ReactEventHandler = (event: React.BaseSyntheticEvent) => Promise<void> | void;

export type MessageProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
> = {
  /** The message object */
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** Additional props for underlying MessageInput component, [Available props](https://getstream.github.io/stream-chat-react/#messageinput) */
  additionalMessageInputProps?: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>;
  /** Object containing custom message actions and function handlers */
  customMessageActions?: MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>['customMessageActions'];
  /** If true, disables the ability for users to quote messages, defaults to false */
  disableQuotedMessages?: boolean;
  /** Override the default formatting of the date. This is a function that has access to the original date object, returns a string  */
  formatDate?: (date: Date) => string;
  /**
   * Function that returns the notification text to be displayed when a flag message request fails. This function receives the
   * flagged [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) as its argument.
   */
  getFlagMessageErrorNotification?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => string;
  /**
   * Function that returns the notification text to be displayed when a flag message request succeeds. This function receives the
   * flagged [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) as its argument.
   */
  getFlagMessageSuccessNotification?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  ) => string;
  /**
   * Function that returns the notification text to be displayed when a mute user request fails. This function receives the
   * muted [user object](https://getstream.io/chat/docs/javascript/update_users/?language=javascript) as its argument.
   */
  getMuteUserErrorNotification?: (user: UserResponse<Us>) => string;
  /**
   * Function that returns the notification text to be displayed when a mute user request succeeds. This function receives the
   * muted [user object](https://getstream.io/chat/docs/javascript/update_users/?language=javascript) as its argument.
   */
  getMuteUserSuccessNotification?: (user: UserResponse<Us>) => string;
  /**
   * Function that returns the notification text to be displayed when a pin message request fails. This function receives the
   * pinned [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) as its argument.
   */
  getPinMessageErrorNotification?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => string;
  /** A list of styles to apply to this message, ie. top, bottom, single */
  groupStyles?: GroupStyle[];
  /** Whether the threaded message is the first in the thread list */
  initialMessage?: boolean;
  /** Latest message id on current channel */
  lastReceivedId?: string | null;
  /** UI component to display a Message in MessageList, overrides value in [ComponentContext](https://getstream.github.io/stream-chat-react/#section-componentcontext) */
  Message?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['Message'];
  /** Array of allowed message actions (ex: ['edit', 'delete', 'flag', 'mute', 'pin', 'quote', 'react', 'reply']). To disable all actions, provide an empty array. */
  messageActions?: MessageActionsArray;
  /** DOMRect object for parent MessageList component */
  messageListRect?: DOMRect;
  /** If true, only the sender of the message has editing privileges */
  onlySenderCanEdit?: boolean;
  /** Custom mention click handler to override default in [ChannelActionContext](https://getstream.github.io/stream-chat-react/#section-channelactioncontext) */
  onMentionsClick?: ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>['onMentionsClick'];
  /** Custom mention hover handler to override default in [ChannelActionContext](https://getstream.github.io/stream-chat-react/#section-channelactioncontext) */
  onMentionsHover?: ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>['onMentionsHover'];
  /** Custom function to run on user avatar click */
  onUserClick?: UserEventHandler<Us>;
  /** Custom function to run on user avatar hover */
  onUserHover?: UserEventHandler<Us>;
  /** Custom open thread handler to override default in [ChannelActionContext](https://getstream.github.io/stream-chat-react/#section-channelactioncontext) */
  openThread?: ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>['openThread'];
  /** The user roles allowed to pin messages in various channel types */
  pinPermissions?: PinPermissions;
  /** A list of users that have read this Message */
  readBy?: UserResponse<Us>[];
  /** Custom function to render message text content, defaults to the renderText function: [utils](https://github.com/GetStream/stream-chat-react/blob/master/src/utils.ts) */
  renderText?: (
    text?: string,
    mentioned_users?: UserResponse<Us>[],
    options?: RenderTextOptions,
  ) => JSX.Element | null;
  /** Custom retry send message handler to override default in [ChannelActionContext](https://getstream.github.io/stream-chat-react/#section-channelactioncontext) */
  retrySendMessage?: ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>['retrySendMessage'];
  /** Whether or not the Message is in a Thread */
  threadList?: boolean;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
};

export type MessageUIComponentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Partial<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>>;

export type PinIndicatorProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  t?: TFunction;
};
