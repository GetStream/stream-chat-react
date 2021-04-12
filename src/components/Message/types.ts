import type { TFunction } from 'i18next';
import type { Channel, ChannelConfigWithInfo, ChannelState, Mute, UserResponse } from 'stream-chat';

import type { ActionHandlerReturnType, PinPermissions, UserEventHandler } from './hooks';
import type { MessageActionsArray } from './utils';

import type { GroupStyle } from '../MessageList/utils';
import type { MessageInputProps } from '../MessageInput/MessageInput';

import type { ChannelActionContextValue } from '../../context/ChannelActionContext';
import type { StreamMessage } from '../../context/ChannelStateContext';
import type { ComponentContextValue } from '../../context/ComponentContext';
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
} from '../../../types/types';

export type MouseEventHandler = (
  event: React.MouseEvent<HTMLElement, MouseEvent>,
) => Promise<void> | void;

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
  /** The currently active channel */
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /** Override the default formatting of the date. This is a function that has access to the original date object, returns a string  */
  formatDate?: (date: Date) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error.
   * This function should accept a [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) which is flagged
   * */
  getFlagMessageErrorNotification?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful.
   * This function should accept a [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) which is flagged
   * */
  getFlagMessageSuccessNotification?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  ) => string;
  /** Function that returns message/text as string to be shown as notification, when request for muting a user runs into error */
  getMuteUserErrorNotification?: (user: UserResponse<Us>) => string;
  /** Function that returns message/text as string to be shown as notification, when request for muting a user is successful */
  getMuteUserSuccessNotification?: (user: UserResponse<Us>) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for pinning a message runs into error.
   * This function should accept a [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript)
   * */
  getPinMessageErrorNotification?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => string;
  /** A list of styles to apply to this message, ie. top, bottom, single */
  groupStyles?: GroupStyle[];
  /** Whether the threaded message is the first in the thread list */
  initialMessage?: boolean;
  /** Latest message id on current channel */
  lastReceivedId?: string | null;
  /** @see See [ChannelStateContext](https://getstream.github.io/stream-chat-react/#section-channelstatecontext) */
  members?: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['members'];
  /** UI component to display a Message in MessageList, overrides value in [ComponentContext](https://getstream.github.io/stream-chat-react/#section-componentcontext) */
  Message?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['Message'];
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'flag', 'mute', 'pin', 'react', 'reply'].
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions?: MessageActionsArray;
  /** DOMRect object for parent MessageList component */
  messageListRect?: DOMRect;
  /** Array of muted users coming from [ChannelStateContext](https://getstream.github.io/stream-chat-react/#section-channelstatecontext) */
  mutes?: Mute<Us>[];
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
  /** The user roles allowed to pin Messages in various channel types */
  pinPermissions?: PinPermissions;
  /** A list of users that have read this Message */
  readBy?: UserResponse<Us>[];
  /** Custom retry send message handler to override default in [ChannelActionContext](https://getstream.github.io/stream-chat-react/#section-channelactioncontext) */
  retrySendMessage?: ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>['retrySendMessage'];
  /** Whether or not the Message is in a Thread */
  threadList?: boolean;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
  /** Watchers on the currently active Channel */
  watchers?: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watchers'];
};

type MessagePropsToOmit = 'channel' | 'onUserClick' | 'onUserHover';

export type MessageUIComponentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Omit<MessageProps<At, Ch, Co, Ev, Me, Re, Us>, MessagePropsToOmit> & {
  /** If actions such as edit, delete, flag, mute are enabled on Message */
  actionsEnabled: boolean;
  /** Function to exit edit state */
  clearEditingState: (
    event?: React.MouseEvent<HTMLElement, globalThis.MouseEvent> | undefined,
  ) => void;
  /** If the Message is in edit state */
  editing: boolean;
  /**
   * Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'pin', 'react', 'reply'].
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.tsx) component for default implementation.
   * */
  getMessageActions: () => MessageActionsArray;
  /** Function to send an action in a Channel */
  handleAction: ActionHandlerReturnType;
  /** Function to delete a message in a Channel */
  handleDelete: MouseEventHandler;
  /** Function to edit a message in a Channel */
  handleEdit: MouseEventHandler;
  /** Function to flag a message in a Channel */
  handleFlag: MouseEventHandler;
  /** Function to mute a user in a Channel */
  handleMute: MouseEventHandler;
  /** Function to open a Thread on a Message */
  handleOpenThread: MouseEventHandler;
  /** Function to pin a Message in a Channel */
  handlePin: MouseEventHandler;
  /** Function to post a reaction on a Message */
  handleReaction: (
    reactionType: string,
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => Promise<void>;
  /** Function to retry sending a Message */
  handleRetry: ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>['retrySendMessage'];
  /** Function that returns whether or not the Message belongs to the current user */
  isMyMessage: () => boolean;
  /** Handler function for a click event on an @mention in Message */
  onMentionsClickMessage: MouseEventHandler;
  /** Handler function for a hover event on an @mention in Message */
  onMentionsHoverMessage: MouseEventHandler;
  /** Handler function for a click event on the user that posted the Message */
  onUserClick: MouseEventHandler;
  /** Handler function for a hover event on the user that posted the Message */
  onUserHover: MouseEventHandler;
  /** Function to toggle the edit state on a Message */
  setEditingState: MouseEventHandler;
  /** Channel config object */
  channelConfig?: ChannelConfigWithInfo<Co>;
  /** Custom function to render message text content, defaults to the renderText function: [utils](https://github.com/GetStream/stream-chat-react/blob/master/src/utils.ts) */
  renderText?: (
    text?: string,
    mentioned_users?: UserResponse<Us>[],
    options?: RenderTextOptions,
  ) => JSX.Element | null;
};

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
