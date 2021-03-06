import type { TFunction } from 'i18next';
import type {
  Channel,
  ChannelConfigWithInfo,
  ChannelState,
  MessageResponse,
  Mute,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import type { MessageDeletedProps } from './MessageDeleted';
import type {
  ActionHandlerReturnType,
  PinPermissions,
  UserEventHandler,
} from './hooks';
import type { MessageActionsArray } from './utils';

import type { AttachmentProps } from '../Attachment';
import type { AvatarProps } from '../Avatar';
import type { GroupStyle } from '../MessageList/MessageListInner';
import type { ReactionsListProps } from '../Reactions';
import type { ReactionSelectorProps } from '../Reactions/ReactionSelector';

import type {
  RetrySendMessage,
  StreamMessage,
} from '../../context/ChannelContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type MouseEventHandler = (
  event: React.MouseEvent<HTMLElement, MouseEvent>,
) => Promise<void> | void;

export type MessageProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /** The message object */
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Additional props for underlying MessageInput component
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps?: UnknownType; // TODO - add MessageInputProps when typed
  /**
   * Function to add custom notification on message list
   * @param text Notification text to display
   * @param type Type of notification
   * */
  addNotification?: (
    notificationText: string,
    type: 'success' | 'error',
  ) => void;
  /**
   * Attachment UI component to display attachment in individual message
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  Attachment?: React.ComponentType<AttachmentProps<At>>;
  /**
   * Custom UI component to display user avatar
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar?: React.ComponentType<AvatarProps>;
  /** The current channel this message is displayed in */
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /** The client connection object for connecting to Stream */
  client?: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  /** Override the default formatting of the date. This is a function that has access to the original date object, returns a string  */
  formatDate?: (date: Date) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error
   * This function should accept following params:
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
   * */
  getFlagMessageErrorNotification?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  ) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
   * This function should accept following params:
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
   * */
  getFlagMessageSuccessNotification?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  ) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error
   * This function should accept following params:
   * @param user A user object which is being muted
   * */
  getMuteUserErrorNotification?: (user: UserResponse<Us>) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user is successful
   * This function should accept following params:
   * @param user A user object which is being muted
   * */
  getMuteUserSuccessNotification?: (user: UserResponse<Us>) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for pinning a message runs into error
   * This function should accept following params:
   * @param message A [message object](https://getstream.io/chat/docs/#message_format)
   * */
  getPinMessageErrorNotification?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  ) => string;
  /** A list of styles to apply to this message, ie. top, bottom, single */
  groupStyles?: GroupStyle[];
  /** Whether the threaded message is the first in the thread list */
  initialMessage?: boolean;
  /** Latest message id on current channel */
  lastReceivedId?: string | null;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  members?: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['members'];
  /**
   * Message UI component to display a message in message list
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  Message?: React.ComponentType<
    MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'flag', 'mute', 'react', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions?: MessageActionsArray;
  /** DOMRect object for parent MessageList component */
  messageListRect?: DOMRect;
  /** Array of muted users coming from channel context */
  mutes?: Mute<Us>[];
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  onMentionsClick?: (
    event: React.MouseEvent<HTMLElement>,
    mentioned_users: UserResponse<Us>[],
  ) => void;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  onMentionsHover?: (
    event: React.MouseEvent<HTMLElement>,
    mentioned_users: UserResponse<Us>[],
  ) => void;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  onUserClick?: UserEventHandler<Us>;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  onUserHover?: UserEventHandler<Us>;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  openThread?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
    event: React.SyntheticEvent,
  ) => void;
  /** The user roles allowed to pin messages in various channel types */
  pinPermissions?: PinPermissions;
  /** A list of users that have read this message */
  readBy?: UserResponse<Us>[];
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  removeMessage?: (message: MessageResponse<At, Ch, Co, Me, Re, Us>) => void;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  retrySendMessage?: RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** Whether or not the message is in a thread */
  threadList?: boolean;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  updateMessage?: (message: MessageResponse<At, Ch, Co, Me, Re, Us>) => void;
  /** Watchers on the currently active channel */
  watchers?: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watchers'];
};

export type MessageUIComponentProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /** If actions such as edit, delete, flag, mute are enabled on message */
  actionsEnabled: boolean;
  /** Function to exit edit state */
  clearEditingState: (
    event?: React.MouseEvent<HTMLElement, globalThis.MouseEvent> | undefined,
  ) => void;
  /** If the message is in edit state */
  editing: boolean;
  /**
   * Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'react', 'reply']
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.tsx) component for default implementation.
   * */
  getMessageActions: () => MessageActionsArray;
  /** Function to send an action in a channel */
  handleAction: ActionHandlerReturnType;
  /** Function to delete a message in a channel */
  handleDelete: MouseEventHandler;
  /** Function to edit a message in a channel */
  handleEdit: MouseEventHandler;
  /** Function to flag a message in a channel */
  handleFlag: MouseEventHandler;
  /** Function to mute a user in a channel */
  handleMute: MouseEventHandler;
  /** Function to open a thread on a message */
  handleOpenThread: MouseEventHandler;
  /** Function to pin a message in a channel */
  handlePin: MouseEventHandler;
  /** Function to post a reaction on a message */
  handleReaction: (
    reactionType: string,
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => Promise<void>;
  /** Function to retry sending a message */
  handleRetry: RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** Function to toggle the edit state on a message */
  setEditingState: MouseEventHandler;
  /** Channel config object */
  channelConfig?: ChannelConfigWithInfo<Co>;
  /**
   * Custom UI component to override default edit message input
   * Defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.tsx)
   * */
  EditMessageInput?: React.ComponentType<unknown>; // TODO - add React.ComponentType<MessageInputProps<generics>> when typed
  /** Function that returns whether or not the message belongs to the current user */
  isMyMessage?: () => boolean;
  /**
   * The component to be rendered if the message has been deleted
   * Defaults to and accepts same props as: [MessageDeleted](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageDeleted.tsx)
   */
  MessageDeleted?: React.ComponentType<
    MessageDeletedProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /** Handler function for a click event on an @mention in message */
  onMentionsClickMessage?: MouseEventHandler;
  /** Handler function for a hover event on an @mention in message */
  onMentionsHoverMessage?: MouseEventHandler;
  /** Handler function for a click event on the user that posted the message */
  onUserClick?: MouseEventHandler;
  /** Handler function for a hover event on the user that posted the message */
  onUserHover?: MouseEventHandler;
  /**
   * Custom UI component to override default pinned message indicator
   * Defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icon.tsx)
   * */
  PinIndicator?: React.ComponentType<PinIndicatorProps>;
  /**
   * A component to display the selector that allows a user to react to a certain message
   * Defaults to and accepts same props as: [ReactionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionSelector.tsx)
   */
  ReactionSelector?: React.ForwardRefExoticComponent<
    ReactionSelectorProps<Re, Us>
  >;
  /**
   * A component to display the a message list of reactions
   * Defaults to and accepts same props as: [ReactionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsList.tsx)
   */
  ReactionsList?: React.ComponentType<ReactionsListProps<Re, Us>>;
  /** Whether or not the current message is in a thread */
  threadList?: boolean;
};

export type PinIndicatorProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  t?: TFunction;
};
