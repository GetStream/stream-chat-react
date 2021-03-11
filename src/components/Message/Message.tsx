import React, { useCallback } from 'react';

import { MessageSimple } from './MessageSimple';
import {
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

import { useChannelContext } from '../../context/ChannelContext';

import type { MessageProps } from './types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

const MessageWithContext = <
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
    channel,
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
  const { channel: propChannel } = props;

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

  return <MemoizedMessage {...props} channel={channel} />;
};
