import clsx from 'clsx';
import throttle from 'lodash.throttle';
import React from 'react';
import { ItemProps, ListItem } from 'react-virtuoso';

import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { isMessageEdited, Message } from '../Message';

import { StreamMessage, useComponentContext } from '../../context';
import { getIsFirstUnreadMessage, isDateSeparatorMessage } from './utils';

import type { GroupStyle } from './utils';
import type { VirtuosoContext } from './VirtualizedMessageList';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';

const PREPEND_OFFSET = 10 ** 7;

export function calculateItemIndex(virtuosoIndex: number, numItemsPrepended: number) {
  return virtuosoIndex + numItemsPrepended - PREPEND_OFFSET;
}

export function calculateFirstItemIndex(numItemsPrepended: number) {
  return PREPEND_OFFSET - numItemsPrepended;
}

export const makeItemsRenderedHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  renderedItemsActions: Array<(msg: StreamMessage<StreamChatGenerics>[]) => void>,
  processedMessages: StreamMessage<StreamChatGenerics>[],
) =>
  throttle((items: ListItem<UnknownType>[]) => {
    const renderedMessages = items
      .map((item) => {
        if (!item.originalIndex) return undefined;
        return processedMessages[calculateItemIndex(item.originalIndex, PREPEND_OFFSET)];
      })
      .filter((msg) => !!msg);
    renderedItemsActions.forEach((action) =>
      action(renderedMessages as StreamMessage<StreamChatGenerics>[]),
    );
  }, 200);

type CommonVirtuosoComponentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  context?: VirtuosoContext<StreamChatGenerics>;
};
// using 'display: inline-block'
// traps CSS margins of the item elements, preventing incorrect item measurements
export const Item = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  context,
  ...props
}: ItemProps & CommonVirtuosoComponentProps<StreamChatGenerics>) => {
  if (!context) return <></>;

  const message =
    context.processedMessages[
      calculateItemIndex(props['data-item-index'], context.numItemsPrepended)
    ];
  const groupStyles: GroupStyle = context.messageGroupStyles[message.id];

  return (
    <div
      {...props}
      className={
        context?.customClasses?.virtualMessage ||
        clsx('str-chat__virtual-list-message-wrapper str-chat__li', {
          [`str-chat__li--${groupStyles}`]: groupStyles,
        })
      }
    />
  );
};
export const Header = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  context,
}: CommonVirtuosoComponentProps<StreamChatGenerics>) => {
  const { LoadingIndicator = DefaultLoadingIndicator } =
    useComponentContext<StreamChatGenerics>('VirtualizedMessageListHeader');

  return (
    <>
      {context?.head}
      {context?.loadingMore && LoadingIndicator && (
        <div className='str-chat__virtual-list__loading'>
          <LoadingIndicator size={20} />
        </div>
      )}
    </>
  );
};
export const EmptyPlaceholder = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  context,
}: CommonVirtuosoComponentProps<StreamChatGenerics>) => {
  const { EmptyStateIndicator = DefaultEmptyStateIndicator } =
    useComponentContext<StreamChatGenerics>('VirtualizedMessageList');

  // prevent showing that there are no messages if there actually are messages (for some reason virtuoso decides to render empty placeholder first, even though it has the totalCount prop > 0)
  if (
    typeof context?.processedMessages !== 'undefined' &&
    context.processedMessages.length > 0
  )
    return null;

  return (
    <>
      {EmptyStateIndicator && (
        <EmptyStateIndicator listType={context?.threadList ? 'thread' : 'message'} />
      )}
    </>
  );
};

export const messageRenderer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  virtuosoIndex: number,
  _data: UnknownType,
  virtuosoContext: VirtuosoContext<StreamChatGenerics>,
) => {
  const {
    additionalMessageInputProps,
    closeReactionSelectorOnClick,
    customMessageActions,
    customMessageRenderer,
    DateSeparator,
    firstUnreadMessageId,
    formatDate,
    lastReadDate,
    lastReadMessageId,
    lastReceivedMessageId,
    Message: MessageUIComponent,
    messageActions,
    messageGroupStyles,
    MessageSystem,
    numItemsPrepended,
    openThread,
    ownMessagesReadByOthers,
    processedMessages: messageList,
    reactionDetailsSort,
    shouldGroupByUser,
    sortReactionDetails,
    sortReactions,
    threadList,
    unreadMessageCount = 0,
    UnreadMessagesSeparator,
    virtuosoRef,
  } = virtuosoContext;

  const streamMessageIndex = calculateItemIndex(virtuosoIndex, numItemsPrepended);

  if (customMessageRenderer) {
    return customMessageRenderer(messageList, streamMessageIndex);
  }

  const message = messageList[streamMessageIndex];

  if (!message) return <div style={{ height: '1px' }}></div>; // returning null or zero height breaks the virtuoso

  if (isDateSeparatorMessage(message)) {
    return DateSeparator ? (
      <DateSeparator date={message.date} unread={message.unread} />
    ) : null;
  }

  if (message.type === 'system') {
    return MessageSystem ? <MessageSystem message={message} /> : null;
  }

  const groupedByUser =
    shouldGroupByUser &&
    streamMessageIndex > 0 &&
    message.user?.id === messageList[streamMessageIndex - 1].user?.id;
  const maybePrevMessage: StreamMessage<StreamChatGenerics> | undefined =
    messageList[streamMessageIndex - 1];
  const maybeNextMessage: StreamMessage<StreamChatGenerics> | undefined =
    messageList[streamMessageIndex + 1];

  // FIXME: firstOfGroup & endOfGroup should be derived from groupStyles which apply a more complex logic
  const firstOfGroup =
    shouldGroupByUser &&
    (message.user?.id !== maybePrevMessage?.user?.id ||
      (maybePrevMessage && isMessageEdited(maybePrevMessage)));

  const endOfGroup =
    shouldGroupByUser &&
    (message.user?.id !== maybeNextMessage?.user?.id || isMessageEdited(message));

  const isFirstUnreadMessage = getIsFirstUnreadMessage({
    firstUnreadMessageId,
    isFirstMessage: streamMessageIndex === 0,
    lastReadDate,
    lastReadMessageId,
    message,
    previousMessage: streamMessageIndex ? messageList[streamMessageIndex - 1] : undefined,
    unreadMessageCount,
  });

  return (
    <>
      {isFirstUnreadMessage && (
        <div className='str-chat__unread-messages-separator-wrapper'>
          <UnreadMessagesSeparator unreadCount={unreadMessageCount} />
        </div>
      )}
      <Message
        additionalMessageInputProps={additionalMessageInputProps}
        autoscrollToBottom={virtuosoRef.current?.autoscrollToBottom}
        closeReactionSelectorOnClick={closeReactionSelectorOnClick}
        customMessageActions={customMessageActions}
        endOfGroup={endOfGroup}
        firstOfGroup={firstOfGroup}
        formatDate={formatDate}
        groupedByUser={groupedByUser}
        groupStyles={[messageGroupStyles[message.id] ?? '']}
        lastReceivedId={lastReceivedMessageId}
        message={message}
        Message={MessageUIComponent}
        messageActions={messageActions}
        openThread={openThread}
        reactionDetailsSort={reactionDetailsSort}
        readBy={ownMessagesReadByOthers[message.id] || []}
        sortReactionDetails={sortReactionDetails}
        sortReactions={sortReactions}
        threadList={threadList}
      />
    </>
  );
};
