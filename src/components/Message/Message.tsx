import React, { useCallback } from 'react';

import { MessageSimple } from './MessageSimple';
import {
  ActionHandlerReturnType,
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

import { RetrySendMessage, useChannelContext } from '../../context/ChannelContext';

import type { Channel } from 'stream-chat';

import type { MessageProps, ReactEventHandler } from './types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

type MessageWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = MessageProps<At, Ch, Co, Ev, Me, Re, Us> & {
  canPin: boolean;
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  handleAction: ActionHandlerReturnType;
  handleDelete: ReactEventHandler;
  handleFlag: ReactEventHandler;
  handleMute: ReactEventHandler;
  handleOpenThread: ReactEventHandler;
  handlePin: ReactEventHandler;
  handleReaction: ReturnType<typeof useReactionHandler>;
  handleRetry: RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us>;
  onMentionsClickMessage: ReactEventHandler;
  onMentionsHoverMessage: ReactEventHandler;
  userRoles: {
    canDeleteMessage: boolean;
    canEditMessage: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    isMyMessage: boolean;
    isOwner: boolean;
  };
};

const MessageWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    canPin,
    channel,
    formatDate,
    groupStyles = [],
    handleAction,
    handleDelete,
    handleFlag,
    handleMute,
    handleOpenThread,
    handlePin,
    handleReaction,
    handleRetry,
    Message: MessageUIComponent = MessageSimple,
    message,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    onMentionsClickMessage,
    onMentionsHoverMessage,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    userRoles,
  } = props;

  const channelConfig = channel.getConfig && channel.getConfig();

  const { clearEdit, editing, setEdit } = useEditHandler();

  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });

  const { isAdmin, isModerator, isMyMessage } = userRoles;

  const canEdit = isMyMessage || isModerator || isAdmin;
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

  const actionsEnabled = message && message.type === 'regular' && message.status === 'received';

  return (
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
      onMentionsClickMessage={onMentionsClickMessage}
      onMentionsHoverMessage={onMentionsHoverMessage}
      onUserClick={onUserClick}
      onUserHover={onUserHover}
      setEditingState={setEdit}
    />
  );
};

const MemoizedMessage = React.memo(
  MessageWithContext,
  areMessagePropsEqual,
) as typeof MessageWithContext;

/**
 * Message - A high level component which implements all the logic required for a Message.
 * The actual rendering of the Message is delegated via the "Message" property.
 * @example ./Message.md
 */
export const Message = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    addNotification,
    channel: propChannel,
    getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification,
    getMuteUserErrorNotification,
    getMuteUserSuccessNotification,
    getPinMessageErrorNotification,
    message,
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
    openThread: propOpenThread,
    pinPermissions = defaultPinPermissions,
    retrySendMessage: propRetrySendMessage,
  } = props;

  const { channel: contextChannel } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  const channel = propChannel || contextChannel;

  const handleAction = useActionHandler(message);
  const handleDelete = useDeleteHandler(message);
  const handleOpenThread = useOpenThreadHandler(message, propOpenThread);
  const handleReaction = useReactionHandler(message);
  const handleRetry = useRetryHandler(propRetrySendMessage);
  const userRoles = useUserRole(message);

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

  return (
    <MemoizedMessage
      {...props}
      canPin={canPin}
      channel={channel}
      handleAction={handleAction}
      handleDelete={handleDelete}
      handleFlag={handleFlag}
      handleMute={handleMute}
      handleOpenThread={handleOpenThread}
      handlePin={handlePin}
      handleReaction={handleReaction}
      handleRetry={handleRetry}
      onMentionsClickMessage={onMentionsClick}
      onMentionsHoverMessage={onMentionsHover}
      userRoles={userRoles}
    />
  );
};
