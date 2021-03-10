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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /** The message object */
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Additional props for underlying MessageInput component.
   * [Available props](https://getstream.github.io/stream-chat-react/#messageinput)
   * */
  additionalMessageInputProps?: UnknownType; // TODO - add MessageInputProps when typed
  /**
   * Function to add custom notification on message list
   * @param notificationText Notification text to display
   * @param type Type of notification
   * */
  addNotification?: (
    notificationText: string,
    type: 'success' | 'error',
  ) => void;
  /**
   * Attachment UI component to display attachment in individual message.
   * Available from [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext)
   * */
  Attachment?: React.ComponentType<AttachmentProps<At>>;
  /**
   * Custom UI component to display user avatar.
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx)
   * */
  Avatar?: React.ComponentType<AvatarProps>;
  /** The current channel this message is displayed in */
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /** The client connection object for connecting to Stream */
  client?: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  /** Override the default formatting of the date. This is a function that has access to the original date object, returns a string  */
  formatDate?: (date: Date) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error.
   * This function should accept following params:
   * @param message A [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) which is flagged.
   * */
  getFlagMessageErrorNotification?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  ) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful.
   * This function should accept following params:
   * @param message A [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) which is flagged.
   * */
  getFlagMessageSuccessNotification?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  ) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error.
   * This function should accept following params:
   * @param user A user object which is being muted
   * */
  getMuteUserErrorNotification?: (user: UserResponse<Us>) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user is successful.
   * This function should accept following params:
   * @param user A user object which is being muted
   * */
  getMuteUserSuccessNotification?: (user: UserResponse<Us>) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for pinning a message runs into error.
   * This function should accept following params:
   * @param message A [message object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript)
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
  /** @see See [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  members?: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['members'];
  /**
   * Message UI component to display a Message in MessageList.
   * Available from [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext)
   * */
  Message?: React.ComponentType<
    MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'flag', 'mute', 'react', 'reply'].
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions?: MessageActionsArray;
  /** DOMRect object for parent MessageList component */
  messageListRect?: DOMRect;
  /** Array of muted users coming from [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  mutes?: Mute<Us>[];
  /** @see See [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  onMentionsClick?: (
    event: React.MouseEvent<HTMLElement>,
    mentioned_users: UserResponse<Us>[],
  ) => void;
  /** @see See [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  onMentionsHover?: (
    event: React.MouseEvent<HTMLElement>,
    mentioned_users: UserResponse<Us>[],
  ) => void;
  /** @see See [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  onUserClick?: UserEventHandler<Us>;
  /** @see See [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  onUserHover?: UserEventHandler<Us>;
  /** @see See [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  openThread?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
    event: React.SyntheticEvent,
  ) => void;
  /** The user roles allowed to pin Messages in various channel types */
  pinPermissions?: PinPermissions;
  /** A list of users that have read this Message */
  readBy?: UserResponse<Us>[];
  /** @see See [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  removeMessage?: (message: MessageResponse<At, Ch, Co, Me, Re, Us>) => void;
  /** @see See [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  retrySendMessage?: RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** Whether or not the Message is in a Thread */
  threadList?: boolean;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
  /** @see See [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  updateMessage?: (message: MessageResponse<At, Ch, Co, Me, Re, Us>) => void;
  /** Watchers on the currently active Channel */
  watchers?: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watchers'];
};

export type MessageUIComponentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = MessageProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /** If actions such as edit, delete, flag, mute are enabled on Message */
  actionsEnabled: boolean;
  /** Function to exit edit state */
  clearEditingState: (
    event?: React.MouseEvent<HTMLElement, globalThis.MouseEvent> | undefined,
  ) => void;
  /** If the Message is in edit state */
  editing: boolean;
  /**
   * Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'react', 'reply'].
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
  handleRetry: RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** Function to toggle the edit state on a Message */
  setEditingState: MouseEventHandler;
  /** Channel config object */
  channelConfig?: ChannelConfigWithInfo<Co>;
  /**
   * Custom UI component to override default edit message input.
   * Defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.tsx)
   * */
  EditMessageInput?: React.ComponentType<unknown>; // TODO - add React.ComponentType<MessageInputProps<generics>> when typed
  /** Function that returns whether or not the Message belongs to the current user */
  isMyMessage?: () => boolean;
  /**
   * The component to be rendered if the Message has been deleted.
   * Defaults to and accepts same props as: [MessageDeleted](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageDeleted.tsx)
   */
  MessageDeleted?: React.ComponentType<
    MessageDeletedProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /** Handler function for a click event on an @mention in Message */
  onMentionsClickMessage?: MouseEventHandler;
  /** Handler function for a hover event on an @mention in Message */
  onMentionsHoverMessage?: MouseEventHandler;
  /** Handler function for a click event on the user that posted the Message */
  onUserClick?: MouseEventHandler;
  /** Handler function for a hover event on the user that posted the Message */
  onUserHover?: MouseEventHandler;
  /**
   * Custom UI component to override default pinned Message indicator.
   * Defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icons.tsx)
   * */
  PinIndicator?: React.ComponentType<PinIndicatorProps>;
  /**
   * A component to display the selector that allows a user to react to a certain Message.
   * Defaults to and accepts same props as: [ReactionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionSelector.tsx)
   */
  ReactionSelector?: React.ForwardRefExoticComponent<
    ReactionSelectorProps<Re, Us>
  >;
  /**
   * A component to display the a MessageList of reactions.
   * Defaults to and accepts same props as: [ReactionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsList.tsx)
   */
  ReactionsList?: React.ComponentType<ReactionsListProps<Re, Us>>;
  /** Whether or not the current Message is in a Thread */
  threadList?: boolean;
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
