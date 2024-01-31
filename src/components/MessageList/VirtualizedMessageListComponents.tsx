import { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import { isDate, useComponentContext } from '../../context';
import React from 'react';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { CUSTOM_MESSAGE_TYPE } from '../../constants/messageTypes';
import { Message } from '../Message';
import { ItemProps } from 'react-virtuoso';
import { GroupStyle } from './utils';
import clsx from 'clsx';
import { VirtuosoContext } from './VirtualizedMessageList';

const PREPEND_OFFSET = 10 ** 7;

export function calculateItemIndex(virtuosoIndex: number, numItemsPrepended: number) {
  return virtuosoIndex + numItemsPrepended - PREPEND_OFFSET;
}

export function calculateFirstItemIndex(numItemsPrepended: number) {
  return PREPEND_OFFSET - numItemsPrepended;
}

type CommonVirtuosoComponentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  context?: VirtuosoContext<StreamChatGenerics>;
};
// using 'display: inline-block'
// traps CSS margins of the item elements, preventing incorrect item measurements
export const Item = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  context,
}: CommonVirtuosoComponentProps<StreamChatGenerics>) => {
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext<StreamChatGenerics>(
    'VirtualizedMessageListHeader',
  );
  if (!context?.loadingMore) return null;
  return LoadingIndicator ? (
    <div className='str-chat__virtual-list__loading'>
      <LoadingIndicator size={20} />
    </div>
  ) : (
    context?.head || null
  );
};
export const EmptyPlaceholder = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  context,
}: CommonVirtuosoComponentProps<StreamChatGenerics>) => {
  const {
    EmptyStateIndicator = DefaultEmptyStateIndicator,
  } = useComponentContext<StreamChatGenerics>('VirtualizedMessageList');
  return (
    <>
      {EmptyStateIndicator && (
        <EmptyStateIndicator listType={context?.threadList ? 'thread' : 'message'} />
      )}
    </>
  );
};
export const Footer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { TypingIndicator } = useComponentContext<StreamChatGenerics>('VirtualizedMessageList');
  return TypingIndicator ? <TypingIndicator avatarSize={24} /> : null;
};
export const messageRenderer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
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
    lastReceivedMessageId,
    Message: MessageUIComponent,
    messageActions,
    messageGroupStyles,
    MessageSystem,
    numItemsPrepended,
    ownMessagesReadByOthers,
    processedMessages: messageList,
    shouldGroupByUser,
    virtuosoRef,
  } = virtuosoContext;

  const streamMessageIndex = calculateItemIndex(virtuosoIndex, numItemsPrepended);

  if (customMessageRenderer) {
    return customMessageRenderer(messageList, streamMessageIndex);
  }

  const message = messageList[streamMessageIndex];

  if (!message) return <div style={{ height: '1px' }}></div>; // returning null or zero height breaks the virtuoso

  if (message.customType === CUSTOM_MESSAGE_TYPE.date && message.date && isDate(message.date)) {
    return DateSeparator ? <DateSeparator date={message.date} unread={message.unread} /> : null;
  }

  if (message.type === 'system') {
    return MessageSystem ? <MessageSystem message={message} /> : null;
  }

  const groupedByUser =
    shouldGroupByUser &&
    streamMessageIndex > 0 &&
    message.user?.id === messageList[streamMessageIndex - 1].user?.id;
  const firstOfGroup =
    shouldGroupByUser && message.user?.id !== messageList[streamMessageIndex - 1]?.user?.id;

  const endOfGroup =
    shouldGroupByUser && message.user?.id !== messageList[streamMessageIndex + 1]?.user?.id;

  return (
    <Message
      additionalMessageInputProps={additionalMessageInputProps}
      autoscrollToBottom={virtuosoRef.current?.autoscrollToBottom}
      closeReactionSelectorOnClick={closeReactionSelectorOnClick}
      customMessageActions={customMessageActions}
      endOfGroup={endOfGroup}
      firstOfGroup={firstOfGroup}
      groupedByUser={groupedByUser}
      groupStyles={[messageGroupStyles[message.id] ?? '']}
      lastReceivedId={lastReceivedMessageId}
      message={message}
      Message={MessageUIComponent}
      messageActions={messageActions}
      readBy={ownMessagesReadByOthers[message.id] || []}
    />
  );
};
