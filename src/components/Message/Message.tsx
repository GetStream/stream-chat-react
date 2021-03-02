import React, { useCallback } from 'react';

import { MessageSimple } from './MessageSimple';
import {
  PinPermissions,
  useActionHandler,
  useDeleteHandler,
  useEditHandler,
  useFlagHandler,
  useMentionsHandler,
  useMuteHandler,
  useOpenThreadHandler,
  usePinHandler,
  useReactionHandler,
  useRetryHandler,
  UserEventHandler,
  useUserHandler,
  useUserRole,
} from './hooks';
import {
  areMessagePropsEqual,
  defaultPinPermissions,
  getMessageActions,
  MESSAGE_ACTIONS,
  MessageActionsArray,
} from './utils';

import {
  RetrySendMessage,
  useChannelContext,
} from '../../context/ChannelContext';

import type {
  Channel,
  ChannelState,
  MessageResponse,
  Mute,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import type { AttachmentProps } from '../Attachment';
import type { AvatarProps } from '../Avatar';
import type { GroupStyle } from '../MessageList/MessageListInner';
import type { MessageUIComponentProps } from './MessageSimple';

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

export type EventHandlerReturnType = (
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
  /** The message object. */
  message: MessageResponse<At, Ch, Co, Me, Re, Us>;
  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps?: UnknownType; // TODO - add MessageInputProps when typed
  /**
   * Function to add custom notification on message list.
   * @param text Notification text to display
   * @param type Type of notification
   * */
  addNotification?: (
    notificationText: string,
    type: 'success' | 'error',
  ) => void;
  /**
   * Attachment UI component to display attachment in individual message.
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
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
  ) => string;
  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
   * This function should accept following params:
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
   * */
  getFlagMessageSuccessNotification?: (
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
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
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
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
   * Message UI component to display a message in message list.
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
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
    event: React.SyntheticEvent,
  ) => void;
  /** The user roles allowed to pin messages in various channel types */
  pinPermissions?: PinPermissions;
  /** A list of users that have read this message */
  readBy?: UserResponse<Us>[];
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  removeMessage?: (message: MessageResponse<At, Ch, Co, Me, Re, Us>) => void;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  retrySendMessage?: RetrySendMessage<At, Ch, Co, Me, Re, Us>;
  /** Whether or not the message is in a thread */
  threadList?: boolean;
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML?: boolean;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  updateMessage?: (message: MessageResponse<At, Ch, Co, Me, Re, Us>) => void;
  /** Watchers on the currently active channel */
  watchers?: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watchers'];
};

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ./Message.md
 */
const UnMemoizedMessage = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    addNotification,
    channel: propChannel,
    formatDate,
    getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification,
    getMuteUserErrorNotification,
    getMuteUserSuccessNotification,
    getPinMessageErrorNotification,
    groupStyles = [],
    Message: MessageUIComponent = MessageSimple,
    message,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    openThread: propOpenThread,
    pinPermissions = defaultPinPermissions,
    retrySendMessage: propRetrySendMessage,
  } = props;

  const { channel: contextChannel } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const channel = propChannel || contextChannel;
  const channelConfig = channel?.getConfig && channel.getConfig();

  const handleAction = useActionHandler(message);
  const handleDelete = useDeleteHandler(message);
  const { clearEdit, editing, setEdit } = useEditHandler();

  const handleOpenThread = useOpenThreadHandler(message, propOpenThread);
  const handleReaction = useReactionHandler(message);
  const handleRetry = useRetryHandler(propRetrySendMessage);

  const handleFlag = useFlagHandler(message, {
    getErrorNotification: getFlagMessageErrorNotification,
    getSuccessNotification: getFlagMessageSuccessNotification,
    notify: addNotification,
  });

  const handleMute = useMuteHandler(message, {
    getErrorNotification: getMuteUserErrorNotification,
    getSuccessNotification: getMuteUserSuccessNotification,
    notify: addNotification,
  });

  const { onMentionsClick, onMentionsHover } = useMentionsHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });

  const { canPin, handlePin } = usePinHandler(message, pinPermissions, {
    getErrorNotification: getPinMessageErrorNotification,
    notify: addNotification,
  });

  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });

  const { isAdmin, isModerator, isMyMessage, isOwner } = useUserRole(message);

  const canEdit = isMyMessage || isModerator || isOwner || isAdmin;
  const canDelete = canEdit;
  const canReact = true;
  const canReply = true;

  const messageActionsHandler = useCallback(() => {
    if (!message || !messageActions) {
      return [];
    }

    return getMessageActions(messageActions, {
      canDelete,
      canEdit,
      canFlag: !isMyMessage,
      canMute: !isMyMessage && !!channelConfig?.mutes,
      canPin,
      canReact,
      canReply,
    });
  }, [
    canDelete,
    canEdit,
    canPin,
    canReply,
    canReact,
    channelConfig?.mutes,
    isMyMessage,
    message,
    messageActions,
  ]);

  const actionsEnabled =
    message && message.type === 'regular' && message.status === 'received';

  return (
    MessageUIComponent && (
      <MessageUIComponent
        {...props}
        actionsEnabled={actionsEnabled}
        channelConfig={channelConfig}
        clearEditingState={clearEdit}
        editing={editing}
        formatDate={formatDate}
        getMessageActions={messageActionsHandler}
        groupStyles={groupStyles}
        handleAction={handleAction}
        handleDelete={handleDelete}
        handleEdit={setEdit}
        handleFlag={handleFlag}
        handleMute={handleMute}
        handleOpenThread={handleOpenThread}
        handlePin={handlePin}
        handleReaction={handleReaction}
        handleRetry={handleRetry}
        isMyMessage={() => isMyMessage}
        Message={MessageUIComponent}
        onMentionsClickMessage={onMentionsClick}
        onMentionsHoverMessage={onMentionsHover}
        onUserClick={onUserClick}
        onUserHover={onUserHover}
        readBy={props.readBy || []}
        setEditingState={setEdit}
      />
    )
  );
};

export const Message = React.memo(
  UnMemoizedMessage,
  areMessagePropsEqual,
) as typeof UnMemoizedMessage;
