import React, { useCallback } from 'react';

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

import { RetrySendMessage, useChannelActionContext } from '../../context/ChannelActionContext';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageProvider } from '../../context/MessageContext';

import type { ChannelConfigWithInfo } from 'stream-chat';

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

type MessagePropsToOmit =
  | 'channel'
  | 'onMentionsClick'
  | 'onMentionsHover'
  | 'openThread'
  | 'retrySendMessage';

type MessageWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Omit<MessageProps<At, Ch, Co, Ev, Me, Re, Us>, MessagePropsToOmit> & {
  canPin: boolean;
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
  channelConfig?: ChannelConfigWithInfo<Co>;
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
    channelConfig,
    Message: propMessage,
    message,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    userRoles,
  } = props;

  const { Message: contextMessage } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

  const actionsEnabled = message.type === 'regular' && message.status === 'received';
  const MessageUIComponent = propMessage || contextMessage;

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

  const {
    canPin: canPinPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    messageActions: messageActionsPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    onUserClick: onUserClickPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    onUserHover: onUserHoverPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    userRoles: userRolesPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...rest
  } = props;

  const messageContextValue = {
    ...rest,
    actionsEnabled,
    clearEditingState: clearEdit,
    editing,
    getMessageActions: messageActionsHandler,
    handleEdit: setEdit,
    isMyMessage: () => isMyMessage,
    onUserClick,
    onUserHover,
    setEditingState: setEdit,
  };

  return (
    <MessageProvider value={messageContextValue}>
      <MessageUIComponent
        {...rest}
        actionsEnabled={actionsEnabled}
        clearEditingState={clearEdit}
        editing={editing}
        getMessageActions={messageActionsHandler}
        handleEdit={setEdit}
        isMyMessage={() => isMyMessage}
        onUserClick={onUserClick}
        onUserHover={onUserHover}
        setEditingState={setEdit}
      />
    </MessageProvider>
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

  const { addNotification } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { channel: contextChannel } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();

  const channel = propChannel || contextChannel;
  const channelConfig = channel.getConfig();

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

  const {
    channel: channelPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    onMentionsClick: onMentionsClickPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    onMentionsHover: onMentionsHoverPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    openThread: openThreadPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    retrySendMessage: retryPropPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...rest
  } = props;

  return (
    <MemoizedMessage
      {...rest}
      canPin={canPin}
      channelConfig={channelConfig}
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
