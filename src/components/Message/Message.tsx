import React, { useCallback, useMemo } from 'react';

import {
  useActionHandler,
  useDeleteHandler,
  useFlagHandler,
  useMarkUnreadHandler,
  useMentionsHandler,
  useMuteHandler,
  useOpenThreadHandler,
  usePinHandler,
  useReactionHandler,
  useReactionsFetcher,
  useRetryHandler,
  useUserHandler,
  useUserRole,
} from './hooks';
import { areMessagePropsEqual, getMessageActions, MESSAGE_ACTIONS } from './utils';

import type { MessageContextValue } from '../../context';
import {
  MessageProvider,
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useComponentContext,
  useMessageTranslationViewContext,
} from '../../context';

import { MessageSimple as DefaultMessage } from './MessageSimple';

import type { MessageProps } from './types';

type MessagePropsToOmit =
  | 'onMentionsClick'
  | 'onMentionsHover'
  | 'openThread'
  | 'retrySendMessage';

type MessageContextPropsToPick =
  | 'handleAction'
  | 'handleDelete'
  | 'handleFetchReactions'
  | 'handleFlag'
  | 'handleMarkUnread'
  | 'handleMute'
  | 'handleOpenThread'
  | 'handlePin'
  | 'handleReaction'
  | 'handleRetry'
  | 'mutes'
  | 'onMentionsClickMessage'
  | 'onMentionsHoverMessage'
  | 'reactionDetailsSort'
  | 'sortReactions'
  | 'sortReactionDetails';

type MessageWithContextProps = Omit<MessageProps, MessagePropsToOmit> &
  Pick<MessageContextValue, MessageContextPropsToPick> & {
    canPin: boolean;
    userRoles: ReturnType<typeof useUserRole>;
  };

const MessageWithContext = (props: MessageWithContextProps) => {
  const {
    canPin,
    Message: propMessage,
    message,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    userRoles,
  } = props;

  const { client, isMessageAIGenerated } = useChatContext('Message');
  const { channelConfig, read } = useChannelStateContext('Message');
  const { Message: contextMessage } = useComponentContext('Message');
  const { getTranslationView, setTranslationView: setTranslationViewInContext } =
    useMessageTranslationViewContext();

  const translationView = getTranslationView(message.id, !!message.i18n);
  const setTranslationView = useCallback(
    (view: 'original' | 'translated') => setTranslationViewInContext(message.id, view),
    [message.id, setTranslationViewInContext],
  );

  const actionsEnabled = message.type === 'regular' && message.status === 'received';
  const MessageUIComponent = propMessage ?? contextMessage ?? DefaultMessage;

  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });

  const {
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canQuote,
    canReact,
    canReply,
    isMyMessage,
  } = userRoles;

  const messageIsUnread = useMemo(
    () =>
      !!(
        !isMyMessage &&
        client.user?.id &&
        read &&
        (!read[client.user.id] ||
          (message?.created_at &&
            new Date(message.created_at).getTime() >
              read[client.user.id].last_read.getTime()))
      ),
    [client, isMyMessage, message.created_at, read],
  );

  const messageActionsHandler = useCallback(
    () =>
      getMessageActions(
        messageActions,
        {
          canDelete,
          canEdit,
          canFlag,
          canMarkUnread,
          canMute,
          canPin,
          canQuote,
          canReact,
          canReply,
        },
        channelConfig,
      ),

    [
      messageActions,
      canDelete,
      canEdit,
      canFlag,
      canMarkUnread,
      canMute,
      canPin,
      canQuote,
      canReact,
      canReply,
      channelConfig,
    ],
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

  const messageContextValue: MessageContextValue = {
    ...rest,
    actionsEnabled,
    getMessageActions: messageActionsHandler,
    isMessageAIGenerated,
    isMyMessage: () => isMyMessage,
    messageIsUnread,
    onUserClick,
    onUserHover,
    setTranslationView,
    translationView,
  };

  return (
    <MessageProvider value={messageContextValue}>
      <MessageUIComponent />
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
export const Message = (props: MessageProps) => {
  const {
    closeReactionSelectorOnClick,
    disableQuotedMessages,
    getDeleteMessageErrorNotification,
    getFetchReactionsErrorNotification,
    getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification,
    getMarkMessageUnreadErrorNotification,
    getMarkMessageUnreadSuccessNotification,
    getMuteUserErrorNotification,
    getMuteUserSuccessNotification,
    getPinMessageErrorNotification,
    message,
    onlySenderCanEdit = false,
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
    openThread: propOpenThread,
    pinPermissions,
    reactionDetailsSort,
    retrySendMessage: propRetrySendMessage,
    sortReactionDetails,
    sortReactions,
  } = props;

  const { addNotification } = useChannelActionContext('Message');
  const { highlightedMessageId, mutes } = useChannelStateContext('Message');

  const handleAction = useActionHandler(message);
  const handleOpenThread = useOpenThreadHandler(message, propOpenThread);
  const handleReaction = useReactionHandler(message);
  const handleRetry = useRetryHandler(propRetrySendMessage);
  const userRoles = useUserRole(message, onlySenderCanEdit, disableQuotedMessages);

  const handleFetchReactions = useReactionsFetcher(message, {
    getErrorNotification: getFetchReactionsErrorNotification,
    notify: addNotification,
  });

  const handleDelete = useDeleteHandler(message, {
    getErrorNotification: getDeleteMessageErrorNotification,
    notify: addNotification,
  });

  const handleFlag = useFlagHandler(message, {
    getErrorNotification: getFlagMessageErrorNotification,
    getSuccessNotification: getFlagMessageSuccessNotification,
    notify: addNotification,
  });

  const handleMarkUnread = useMarkUnreadHandler(message, {
    getErrorNotification: getMarkMessageUnreadErrorNotification,
    getSuccessNotification: getMarkMessageUnreadSuccessNotification,
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

  const highlighted = highlightedMessageId === message.id;

  return (
    <MemoizedMessage
      additionalMessageInputProps={props.additionalMessageInputProps}
      autoscrollToBottom={props.autoscrollToBottom}
      canPin={canPin}
      closeReactionSelectorOnClick={closeReactionSelectorOnClick}
      deliveredTo={props.deliveredTo}
      disableQuotedMessages={props.disableQuotedMessages}
      formatDate={props.formatDate}
      groupStyles={props.groupStyles}
      handleAction={handleAction}
      handleDelete={handleDelete}
      handleFetchReactions={handleFetchReactions}
      handleFlag={handleFlag}
      handleMarkUnread={handleMarkUnread}
      handleMute={handleMute}
      handleOpenThread={handleOpenThread}
      handlePin={handlePin}
      handleReaction={handleReaction}
      handleRetry={handleRetry}
      highlighted={highlighted}
      initialMessage={props.initialMessage}
      lastOwnMessage={props.lastOwnMessage}
      lastReceivedId={props.lastReceivedId}
      message={message}
      Message={props.Message}
      messageActions={props.messageActions}
      messageListRect={props.messageListRect}
      mutes={mutes}
      onMentionsClickMessage={onMentionsClick}
      onMentionsHoverMessage={onMentionsHover}
      onUserClick={props.onUserClick}
      onUserHover={props.onUserHover}
      pinPermissions={props.pinPermissions}
      reactionDetailsSort={reactionDetailsSort}
      readBy={props.readBy}
      renderText={props.renderText}
      returnAllReadData={props.returnAllReadData}
      sortReactionDetails={sortReactionDetails}
      sortReactions={sortReactions}
      threadList={props.threadList}
      unsafeHTML={props.unsafeHTML}
      userRoles={userRoles}
    />
  );
};
