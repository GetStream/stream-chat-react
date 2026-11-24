import clsx from 'clsx';
import throttle from 'lodash.throttle';
import React from 'react';
import type { ItemProps, ListItem } from 'react-virtuoso';

import { VirtualizedMessageListLoadingNextPageUI } from './ListStates';
import { Message } from '../Message';

import type { GroupStyle, RenderedMessage } from './utils';
import { getIsFirstUnreadMessage, isDateSeparatorMessage, isIntroMessage } from './utils';
import { omitUndefinedProps } from './omitUndefinedProps';
import type { VirtuosoContext } from './VirtualizedMessageList';
import type { UnknownType } from '../../types/types';

const PREPEND_OFFSET = 10 ** 7;

export function calculateItemIndex(virtuosoIndex: number, numItemsPrepended: number) {
  return virtuosoIndex + numItemsPrepended - PREPEND_OFFSET;
}

export function calculateFirstItemIndex(numItemsPrepended: number) {
  return PREPEND_OFFSET - numItemsPrepended;
}

export const makeItemsRenderedHandler = (
  renderedItemsActions: Array<(msg: RenderedMessage[]) => void>,
  processedMessages: RenderedMessage[],
) =>
  throttle((items: ListItem<UnknownType>[]) => {
    const renderedMessages = items
      .map((item) => {
        // `originalIndex` is the 0-based position in the data, so 0 is the first loaded message.
        if (item.originalIndex === undefined) return undefined;
        return processedMessages[item.originalIndex];
      })
      .filter((msg) => !!msg);
    renderedItemsActions.forEach((action) =>
      action(renderedMessages as RenderedMessage[]),
    );
  }, 200);

export type CommonVirtuosoComponentProps = {
  context?: VirtuosoContext;
};
// `display: inline-block` traps the items' CSS margins, preventing incorrect item measurements.
// `item` is the row's data, which Virtuoso passes since v4; this list has none (it renders by
// `totalCount`), and spreading it onto the <div> would leak it into the DOM.
export const Item = ({
  context,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip `item` so it is not forwarded to the <div>
  item: _item,
  ...props
}: ItemProps<UnknownType> & CommonVirtuosoComponentProps) => {
  if (!context) return <></>;

  const message =
    context.processedMessages[
      calculateItemIndex(props['data-item-index'], context.numItemsPrepended)
    ];
  // Virtuoso can render an index the list no longer has for one pass (see computeItemKey).
  if (!message) return <div {...props} />;
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
      // Lets the list find a message's item (e.g. to tell when a jumped-to message was viewed).
      data-message-id={message.id}
    />
  );
};
/** Above the messages: the thread's parent message and the older-page indicator. */
export const Header = ({ context }: CommonVirtuosoComponentProps) => (
  <>
    {context?.head}
    {context?.loadingEdge === 'top' && (
      <VirtualizedMessageListLoadingNextPageUI position='top' />
    )}
  </>
);

/** Below the messages: the newer-page indicator. */
export const Footer = ({ context }: CommonVirtuosoComponentProps) =>
  context?.loadingEdge === 'bottom' ? (
    <VirtualizedMessageListLoadingNextPageUI position='bottom' />
  ) : null;

export const messageRenderer = (
  virtuosoIndex: number,
  _data: UnknownType,
  virtuosoContext: VirtuosoContext,
) => {
  const {
    channel,
    closeReactionSelectorOnClick,
    customMessageRenderer,
    DateSeparator,
    firstUnreadMessageId,
    focusedMessageId,
    formatDate,
    lastOwnMessage,
    lastReadDate,
    lastReadMessageId,
    lastReceivedMessageId,
    messageGroupStyles,
    MessageSystem,
    numItemsPrepended,
    onMentionsClick,
    onMentionsHover,
    onUserClick,
    onUserHover,
    ownMessagesDeliveredToOthers,
    ownMessagesReadByOthers,
    processedMessages: messageList,
    reactionDetailsSort,
    renderText,
    returnAllReadData,
    showAvatar,
    sortReactions,
    unreadMessageCount = 0,
    UnreadMessagesSeparator,
    unsafeHTML,
    virtuosoRef,
  } = virtuosoContext;

  const streamMessageIndex = calculateItemIndex(virtuosoIndex, numItemsPrepended);

  if (customMessageRenderer) {
    return customMessageRenderer(messageList, streamMessageIndex);
  }

  const message = messageList[streamMessageIndex];

  // Virtuoso breaks on null or zero height.
  if (!message || isIntroMessage(message)) return <div style={{ height: '1px' }}></div>;

  if (isDateSeparatorMessage(message)) {
    return DateSeparator ? (
      <DateSeparator date={message.date} unread={message.unread} />
    ) : null;
  }

  if (message.type === 'system') {
    return MessageSystem ? (
      <MessageSystem {...omitUndefinedProps({ unsafeHTML })} message={message} />
    ) : null;
  }

  const isFirstUnreadMessage = getIsFirstUnreadMessage({
    channel,
    firstUnreadMessageId,
    isFirstMessage: streamMessageIndex === 0,
    lastReadAt: lastReadDate,
    lastReadMessageId,
    message,
    previousMessage: streamMessageIndex ? messageList[streamMessageIndex - 1] : undefined,
    unreadCount: unreadMessageCount,
  });

  return (
    <>
      {isFirstUnreadMessage && (
        <div className='str-chat__unread-messages-separator-wrapper'>
          <UnreadMessagesSeparator unreadCount={unreadMessageCount} />
        </div>
      )}
      <Message
        autoscrollToBottom={virtuosoRef.current?.autoscrollToBottom}
        closeReactionSelectorOnClick={closeReactionSelectorOnClick}
        deliveredTo={ownMessagesDeliveredToOthers[message.id] || []}
        formatDate={formatDate}
        groupStyles={[messageGroupStyles[message.id] ?? '']}
        highlighted={focusedMessageId === message.id}
        lastOwnMessage={lastOwnMessage}
        lastReceivedId={lastReceivedMessageId}
        message={message}
        onMentionsClick={onMentionsClick}
        onMentionsHover={onMentionsHover}
        onUserClick={onUserClick}
        onUserHover={onUserHover}
        reactionDetailsSort={reactionDetailsSort}
        readBy={ownMessagesReadByOthers[message.id] || []}
        renderText={renderText}
        returnAllReadData={returnAllReadData}
        showAvatar={showAvatar}
        sortReactions={sortReactions}
        unsafeHTML={unsafeHTML}
      />
    </>
  );
};
