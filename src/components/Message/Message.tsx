import React, { useCallback, useContext } from 'react';

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
  useUserHandler,
  useUserRole,
} from './hooks';
import {
  areMessagePropsEqual,
  defaultPinPermissions,
  getMessageActions,
  MESSAGE_ACTIONS,
} from './utils';

import { ChannelContext } from '../../context';

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
import type { MessageProps, TranslationContextValue } from 'types';
import type {
  Channel,
  ChannelMemberResponse,
  Message as ClientMessage,
  MessageResponse,
  Mute,
  User,
  UserResponse,
} from 'stream-chat';

export interface MessageComponentProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> extends MessageProps<At, Ch, Co, Ev, Me, Re, Us>,
    TranslationContextValue {
  /** The current channel this message is displayed in */
  channel?: Channel<Ch>;

  initialMessage?: boolean;

  members?: {
    [user_id: string]: ChannelMemberResponse<Us>;
  };

  messageActions?: Array<string> | boolean;

  mutes?: Mute<Us>[];

  /** Function to be called when a @mention is clicked. Function has access to the DOM event and the target user object */
  onMentionsClick?(
    e: React.MouseEvent,
    mentioned_users: UserResponse<Us>[],
  ): void;

  /** Function to be called when hovering over a @mention. Function has access to the DOM event and the target user object */
  onMentionsHover?(
    e: React.MouseEvent,
    mentioned_users: UserResponse<Us>[],
  ): void;

  /** Function to be called when clicking the user that posted the message. Function has access to the DOM event and the target user object */
  onUserClick?(e: React.MouseEvent, user: User<Us>): void;

  /** Function to be called when hovering the user that posted the message. Function has access to the DOM event and the target user object */
  onUserHover?(e: React.MouseEvent, user: User<Us>): void;

  openThread?(
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
    event: React.SyntheticEvent,
  ): void;

  pinPermissions?: PinPermissions;

  removeMessage?(updatedMessage: MessageResponse<At, Ch, Co, Me, Re, Us>): void;

  retrySendMessage?(message: ClientMessage<At, Me, Us>): Promise<void>;

  threadList?: boolean;

  // XXX: this is a fix for the watchers being passed in MessageList
  // apparently, they are not used anywhere
  watchers?: {
    [user_id: string]: ChannelMemberResponse<Us>;
  };
}

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
  props: MessageComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
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

  const { channel: contextChannel } = useContext(ChannelContext);

  const channel = propChannel || contextChannel;
  const channelConfig = channel?.getConfig && channel.getConfig();

  const handleAction = useActionHandler(message);
  const handleDelete = useDeleteHandler(message);
  const { clearEdit, editing, setEdit } = useEditHandler();
  const handleOpenThread = useOpenThreadHandler(message, propOpenThread);
  const handleReaction = useReactionHandler(message);
  const handleRetry = useRetryHandler(propRetrySendMessage);

  const handleFlag = useFlagHandler<At, Ch, Co, Ev, Me, Re, Us>(message, {
    getErrorNotification: getFlagMessageErrorNotification,
    getSuccessNotification: getFlagMessageSuccessNotification,
    notify: addNotification,
  });

  const handleMute = useMuteHandler<At, Ch, Co, Ev, Me, Re, Us>(message, {
    getErrorNotification: getMuteUserErrorNotification,
    getSuccessNotification: getMuteUserSuccessNotification,
    notify: addNotification,
  });

  const { onMentionsClick, onMentionsHover } = useMentionsHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });

  const { canPin, handlePin } = usePinHandler<At, Ch, Co, Ev, Me, Re, Us>(
    message,
    pinPermissions,
    {
      getErrorNotification: getPinMessageErrorNotification,
      notify: addNotification,
    },
  );

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
        //@ts-expect-error
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
        //@ts-expect-error
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
