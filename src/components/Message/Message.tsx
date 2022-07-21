import React, { useCallback, useRef } from 'react';

import {
  useActionHandler,
  useDeleteHandler,
  useEditHandler,
  useFlagHandler,
  useMentionsHandler,
  useMuteHandler,
  useOpenThreadHandler,
  usePinHandler,
  useReactionClick,
  useReactionHandler,
  useRetryHandler,
  useUserHandler,
  useUserRole,
} from './hooks';
import { areMessagePropsEqual, getMessageActions, MESSAGE_ACTIONS } from './utils';

import {
  MessageContextValue,
  MessageProvider,
  useChannelActionContext,
  useChannelStateContext,
  useComponentContext,
} from '../../context';

import type { MessageProps } from './types';
import type { DefaultStreamChatGenerics } from '../../types/types';

type MessagePropsToOmit = 'onMentionsClick' | 'onMentionsHover' | 'openThread' | 'retrySendMessage';

type MessageContextPropsToPick =
  | 'handleAction'
  | 'handleDelete'
  | 'handleFlag'
  | 'handleMute'
  | 'handleOpenThread'
  | 'handlePin'
  | 'handleReaction'
  | 'handleRetry'
  | 'isReactionEnabled'
  | 'mutes'
  | 'onMentionsClickMessage'
  | 'onMentionsHoverMessage'
  | 'onReactionListClick'
  | 'reactionSelectorRef'
  | 'showDetailedReactions';

type MessageWithContextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Omit<MessageProps<StreamChatGenerics>, MessagePropsToOmit> &
  Pick<MessageContextValue<StreamChatGenerics>, MessageContextPropsToPick> & {
    canPin: boolean;
    userRoles: ReturnType<typeof useUserRole>;
  };

const MessageWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageWithContextProps<StreamChatGenerics>,
) => {
  const {
    canPin,
    groupedByUser,
    Message: propMessage,
    message,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    userRoles,
  } = props;

  const { Message: contextMessage } = useComponentContext<StreamChatGenerics>('Message');

  const actionsEnabled = message.type === 'regular' && message.status === 'received';
  const MessageUIComponent = propMessage || contextMessage;

  const { clearEdit, editing, setEdit } = useEditHandler();

  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });

  const {
    canDelete,
    canEdit,
    canFlag,
    canMute,
    canQuote,
    canReact,
    canReply,
    isMyMessage,
  } = userRoles;

  const messageActionsHandler = useCallback(
    () =>
      getMessageActions(messageActions, {
        canDelete,
        canEdit,
        canFlag,
        canMute,
        canPin,
        canQuote,
        canReact,
        canReply,
      }),
    [messageActions, canDelete, canEdit, canFlag, canMute, canPin, canQuote, canReact, canReply],
  );

  const {
    canPin: canPinPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    messageActions: messageActionsPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    onlySenderCanEdit: onlySenderCanEditPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    onUserClick: onUserClickPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    onUserHover: onUserHoverPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    userRoles: userRolesPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...rest
  } = props;

  const messageContextValue: MessageContextValue<StreamChatGenerics> = {
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
      <MessageUIComponent groupedByUser={groupedByUser} />
      {/* TODO - remove prop in next major release, maintains VML backwards compatibility */}
    </MessageProvider>
  );
};

const MemoizedMessage = React.memo(
  MessageWithContext,
  areMessagePropsEqual,
) as typeof MessageWithContext;

/**
 * The Message component is a context provider which implements all the logic required for rendering
 * an individual message. The actual UI of the message is delegated via the Message prop on Channel.
 */
export const Message = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageProps<StreamChatGenerics>,
) => {
  const {
    closeReactionSelectorOnClick,
    disableQuotedMessages,
    getDeleteMessageErrorNotification,
    getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification,
    getMuteUserErrorNotification,
    getMuteUserSuccessNotification,
    getPinMessageErrorNotification,
    message,
    onlySenderCanEdit = false,
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
    openThread: propOpenThread,
    pinPermissions,
    retrySendMessage: propRetrySendMessage,
  } = props;

  const { addNotification } = useChannelActionContext<StreamChatGenerics>('Message');
  const { highlightedMessageId, mutes } = useChannelStateContext<StreamChatGenerics>('Message');

  const reactionSelectorRef = useRef<HTMLDivElement | null>(null);

  const handleAction = useActionHandler(message);
  const handleOpenThread = useOpenThreadHandler(message, propOpenThread);
  const handleReaction = useReactionHandler(message);
  const handleRetry = useRetryHandler(propRetrySendMessage);
  const userRoles = useUserRole(message, onlySenderCanEdit, disableQuotedMessages);

  const handleDelete = useDeleteHandler(message, {
    getErrorNotification: getDeleteMessageErrorNotification,
    notify: addNotification,
  });

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

  const { isReactionEnabled, onReactionListClick, showDetailedReactions } = useReactionClick(
    message,
    reactionSelectorRef,
    undefined,
    closeReactionSelectorOnClick,
  );

  const highlighted = highlightedMessageId === message.id;

  return (
    <MemoizedMessage
      additionalMessageInputProps={props.additionalMessageInputProps}
      autoscrollToBottom={props.autoscrollToBottom}
      canPin={canPin}
      customMessageActions={props.customMessageActions}
      disableQuotedMessages={props.disableQuotedMessages}
      endOfGroup={props.endOfGroup}
      firstOfGroup={props.firstOfGroup}
      formatDate={props.formatDate}
      groupedByUser={props.groupedByUser}
      groupStyles={props.groupStyles}
      handleAction={handleAction}
      handleDelete={handleDelete}
      handleFlag={handleFlag}
      handleMute={handleMute}
      handleOpenThread={handleOpenThread}
      handlePin={handlePin}
      handleReaction={handleReaction}
      handleRetry={handleRetry}
      highlighted={highlighted}
      initialMessage={props.initialMessage}
      isReactionEnabled={isReactionEnabled}
      lastReceivedId={props.lastReceivedId}
      message={message}
      Message={props.Message}
      messageActions={props.messageActions}
      messageListRect={props.messageListRect}
      mutes={mutes}
      onMentionsClickMessage={onMentionsClick}
      onMentionsHoverMessage={onMentionsHover}
      onReactionListClick={onReactionListClick}
      onUserClick={props.onUserClick}
      onUserHover={props.onUserHover}
      pinPermissions={props.pinPermissions}
      reactionSelectorRef={reactionSelectorRef}
      readBy={props.readBy}
      renderText={props.renderText}
      showDetailedReactions={showDetailedReactions}
      threadList={props.threadList}
      unsafeHTML={props.unsafeHTML}
      userRoles={userRoles}
    />
  );
};
