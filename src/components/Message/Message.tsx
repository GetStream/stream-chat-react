import React, { useCallback } from 'react';

import {
  useActionHandler,
  useDeleteHandler,
  useFlagHandler,
  useMarkUnreadHandler,
  useMentionsHandler,
  useMessagePermissions,
  useMuteHandler,
  useOpenThreadHandler,
  usePinHandler,
  useReactionHandler,
  useReactionsFetcher,
  useRetryHandler,
  useUserHandler,
} from './hooks';
import type { UserEventHandler } from './hooks';
import { areMessagePropsEqual } from './utils';
import { useStableCallback } from '../../utils';

import type { LocalMessage } from 'stream-chat';
import type { MessageContextValue } from '../../context';
import {
  MessageProvider,
  useChatContext,
  useComponentContext,
  useMessageTranslationViewContext,
} from '../../context';

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
    permissions: ReturnType<typeof useMessagePermissions>;
  };

const MessageWithContext = (props: MessageWithContextProps) => {
  const {
    message,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    permissions,
  } = props;

  const { isMessageAIGenerated } = useChatContext();
  const { MessageUI: MessageUIComponent = DefaultMessageUI } = useComponentContext();
  const { getTranslationView, setTranslationView: setTranslationViewInContext } =
    useMessageTranslationViewContext();

  const translationView = getTranslationView(message.id, !!message.i18n);
  const setTranslationView = useCallback(
    (view: 'original' | 'translated') => setTranslationViewInContext(message.id, view),
    [message.id, setTranslationViewInContext],
  );

  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });

  const { isMyMessage } = permissions;

  const {
    onUserClick: onUserClickPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    onUserHover: onUserHoverPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    permissions: permissionsPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...rest
  } = props;

  const messageContextValue: MessageContextValue = {
    ...rest,
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
 * Provides the logic and handlers of a single message through `MessageContext` and renders
 * `ComponentContext.MessageUI`, which defaults to `MessageUI`.
 */
export const Message = (props: MessageProps) => {
  const {
    closeReactionSelectorOnClick,
    message,
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    openThread: propOpenThread,
    reactionDetailsSort,
    sortReactions,
  } = props;

  const handleAction = useActionHandler(message);
  const handleReaction = useReactionHandler(message);
  const permissions = useMessagePermissions(message);

  const handleFetchReactions = useReactionsFetcher(message);

  const handleDelete = useDeleteHandler(message);

  const handleFlag = useFlagHandler(message);

  const handleMarkUnread = useMarkUnreadHandler(message);

  const handleMute = useMuteHandler(message);

  const { onMentionsClick, onMentionsHover } = useMentionsHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });
  // The memoized message ignores handler identity, so a swapped `onUserClick` / `onUserHover`
  // reaches it through these stable wrappers, which always call the latest prop.
  const onUserClick: UserEventHandler = useStableCallback((event, user) =>
    propOnUserClick?.(event, user),
  );
  const onUserHover: UserEventHandler = useStableCallback((event, user) =>
    propOnUserHover?.(event, user),
  );

  const { handlePin } = usePinHandler(message);
  const handleOpenThread = useOpenThreadHandler(message, propOpenThread);
  const retryHandler = useRetryHandler();
  const handleRetry = useCallback(
    (retriedMessage: LocalMessage) =>
      // A retry that fails again marks the message failed, which is how it reports the failure; the
      // rejection itself would be unhandled at every click site.
      retryHandler({ localMessage: retriedMessage }).catch(() => undefined),
    [retryHandler],
  );

  return (
    <MemoizedMessage
      additionalMessageComposerProps={props.additionalMessageComposerProps}
      autoscrollToBottom={props.autoscrollToBottom}
      closeReactionSelectorOnClick={closeReactionSelectorOnClick}
      deliveredTo={props.deliveredTo}
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
      lastOwnMessage={props.lastOwnMessage}
      lastReceivedId={props.lastReceivedId}
      message={message}
      messageListRect={props.messageListRect}
      onMentionsClickMessage={onMentionsClick}
      onMentionsHoverMessage={onMentionsHover}
      onUserClick={onUserClick}
      onUserHover={onUserHover}
      permissions={permissions}
      reactionDetailsSort={reactionDetailsSort}
      readBy={props.readBy}
      renderText={props.renderText}
      returnAllReadData={props.returnAllReadData}
      showAvatar={props.showAvatar}
      sortReactions={sortReactions}
      unsafeHTML={props.unsafeHTML}
    />
  );
};
