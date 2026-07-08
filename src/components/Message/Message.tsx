import React, { useCallback } from 'react';

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

import type { LocalMessage } from 'stream-chat';
import type { MessageContextValue } from '../../context';
import {
  MessageProvider,
  useChannel,
  useChatContext,
  useComponentContext,
  useMessageTranslationViewContext,
} from '../../context';
import { useChannelConfig } from '../Channel/hooks/useChannelConfig';

import { MessageUI as DefaultMessageUI } from './MessageUI';

import type { MessageProps } from './types';

type MessagePropsToOmit = 'onMentionsClick' | 'onMentionsHover' | 'retrySendMessage';

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
  | 'onMentionsClickMessage'
  | 'onMentionsHoverMessage'
  | 'reactionDetailsSort'
  | 'sortReactions';

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
  const {
    Message: contextMessage = DefaultMessageUI,
    // TODO: remove this passthrough once we drop Message from the ComponentContext
    MessageUI: contextMessageUI = contextMessage,
  } = useComponentContext('Message');
  const { getTranslationView, setTranslationView: setTranslationViewInContext } =
    useMessageTranslationViewContext();

  const translationView = getTranslationView(message.id, !!message.i18n);
  const setTranslationView = useCallback(
    (view: 'original' | 'translated') => setTranslationViewInContext(message.id, view),
    [message.id, setTranslationViewInContext],
  );

  const actionsEnabled = message.type === 'regular' && message.status === 'received';
  const MessageUIComponent = propMessage ?? contextMessageUI;

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
    message,
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
    openThread: propOpenThread,
    reactionDetailsSort,
    sortReactions,
  } = props;

  // MERGE-RECONCILE: master removed PR #2909's per-action notification-getter props
  // (getDeleteMessageErrorNotification, getFetchReactionsErrorNotification, etc.) and the
  // `notify` bridge; the merged handler hooks emit errors via client.notifications
  // internally. Handlers are called with `(message)` only (master's canonical style).
  // The per-action custom error/success message API is a dropped PR feature — re-graft if
  // custom notification text is required.
  const handleAction = useActionHandler(message);
  const handleReaction = useReactionHandler(message);
  const userRoles = useUserRole(message, disableQuotedMessages);

  const handleFetchReactions = useReactionsFetcher(message);

  const handleDelete = useDeleteHandler(message);

  const handleFlag = useFlagHandler(message);

  const handleMarkUnread = useMarkUnreadHandler(message);

  const handleMute = useMuteHandler(message);

  const { onMentionsClick, onMentionsHover } = useMentionsHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });

  const { handlePin } = usePinHandler(message);
  const handleOpenThread = useOpenThreadHandler(message, propOpenThread);
  const retryHandler = useRetryHandler();
  const handleRetry = useCallback(
    (retriedMessage: LocalMessage) => retryHandler({ localMessage: retriedMessage }),
    [retryHandler],
  );

  return (
    <MemoizedMessage
      additionalMessageComposerProps={props.additionalMessageComposerProps}
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
      handleOpenThread={handleOpenThread}
      handlePin={handlePin}
      handleReaction={handleReaction}
      handleRetry={handleRetry}
      highlighted={props.highlighted}
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
      sortReactions={sortReactions}
      threadList={props.threadList}
      unsafeHTML={props.unsafeHTML}
      userRoles={userRoles}
    />
  );
};
