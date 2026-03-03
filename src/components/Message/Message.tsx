import React, { useCallback } from 'react';

import {
  useActionHandler,
  useDeleteHandler,
  useFlagHandler,
  useMarkUnreadHandler,
  useMentionsHandler,
  useMuteHandler,
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
  useChannel,
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useComponentContext,
  useMessageTranslationViewContext,
} from '../../context';
import { useChannelConfig } from '../Channel/hooks/useChannelConfig';

import { MessageSimple as DefaultMessage } from './MessageSimple';

import type { MessageProps } from './types';

type MessagePropsToOmit = 'onMentionsClick' | 'onMentionsHover' | 'retrySendMessage';

type MessageContextPropsToPick =
  | 'handleAction'
  | 'handleDelete'
  | 'handleFetchReactions'
  | 'handleFlag'
  | 'handleMarkUnread'
  | 'handleMute'
  | 'handlePin'
  | 'handleReaction'
  | 'handleRetry'
  | 'onMentionsClickMessage'
  | 'onMentionsHoverMessage'
  | 'reactionDetailsSort'
  | 'sortReactions'
  | 'sortReactionDetails';

type MessageWithContextProps = Omit<MessageProps, MessagePropsToOmit> &
  Pick<MessageContextValue, MessageContextPropsToPick> & {
    userRoles: ReturnType<typeof useUserRole>;
  };

const MessageWithContext = (props: MessageWithContextProps) => {
  const {
    Message: propMessage,
    message,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    userRoles,
  } = props;

  const channel = useChannel();
  const { isMessageAIGenerated } = useChatContext('Message');
  const channelConfig = useChannelConfig({ cid: channel.cid });
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
    canPin,
    canQuote,
    canReact,
    canReply,
    isMyMessage,
  } = userRoles;

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
    reactionDetailsSort,
    retrySendMessage: propRetrySendMessage,
    sortReactionDetails,
    sortReactions,
  } = props;

  const { addNotification } = useChannelActionContext('Message');
  const { highlightedMessageId } = useChannelStateContext('Message');

  const handleAction = useActionHandler(message);
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

  const { handlePin } = usePinHandler(message, {
    getErrorNotification: getPinMessageErrorNotification,
    notify: addNotification,
  });

  const highlighted = highlightedMessageId === message.id;

  return (
    <MemoizedMessage
      additionalMessageInputProps={props.additionalMessageInputProps}
      autoscrollToBottom={props.autoscrollToBottom}
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
      onMentionsClickMessage={onMentionsClick}
      onMentionsHoverMessage={onMentionsHover}
      onUserClick={props.onUserClick}
      onUserHover={props.onUserHover}
      reactionDetailsSort={reactionDetailsSort}
      readBy={props.readBy}
      renderText={props.renderText}
      returnAllReadData={props.returnAllReadData}
      sortReactionDetails={sortReactionDetails}
      sortReactions={sortReactions}
      unsafeHTML={props.unsafeHTML}
      userRoles={userRoles}
    />
  );
};
