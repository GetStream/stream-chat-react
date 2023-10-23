import clsx from 'clsx';
import React, { RefObject, useCallback, useMemo } from 'react';

import { isDate, useComponentContext } from '../../../../context';
import { Message, MessageSimple } from '../../../Message';
import { DateSeparator as DefaultDateSeparator } from '../../../DateSeparator';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../../../EmptyStateIndicator';
import { LoadingIndicator as DefaultLoadingIndicator } from '../../../Loading';
import { EventComponent } from '../../../EventComponent';
import { CUSTOM_MESSAGE_TYPE } from '../../../../constants/messageTypes';

import type { Components, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';
import type { GroupStyle } from '../../utils';
import type { DefaultStreamChatGenerics, UnknownType } from '../../../../types/types';
import type { VirtualizedMessageListProps, VirtuosoContext } from '../../VirtualizedMessageList';

type ExtractedVirtuosoProps = 'components';
type ExtractedVirtualizedMessageListProps =
  | 'additionalMessageInputProps'
  | 'closeReactionSelectorOnClick'
  | 'customMessageActions'
  | 'customMessageRenderer'
  | 'head'
  | 'loadingMore'
  | 'Message'
  | 'messageActions'
  | 'shouldGroupByUser'
  | 'threadList';

type UseVirtuosoComponentsParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<VirtualizedMessageListProps<StreamChatGenerics>, ExtractedVirtualizedMessageListProps> &
  Pick<VirtuosoProps<UnknownType, VirtuosoContext<StreamChatGenerics>>, ExtractedVirtuosoProps> & {
    prependOffset: number;
    virtuosoRef: RefObject<VirtuosoHandle>;
  };

export const useVirtualizedMessageListComponents = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  additionalMessageInputProps,
  closeReactionSelectorOnClick,
  components: virtuosoComponentsFromProps,
  customMessageActions,
  customMessageRenderer,
  head,
  loadingMore,
  Message: MessageUIComponentProps,
  messageActions,
  prependOffset,
  shouldGroupByUser,
  threadList,
  virtuosoRef,
}: UseVirtuosoComponentsParams<StreamChatGenerics>) => {
  const {
    DateSeparator = DefaultDateSeparator,
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    MessageSystem = EventComponent,
    TypingIndicator = null,
    VirtualMessage: MessageUIComponentContext = MessageSimple,
  } = useComponentContext<StreamChatGenerics>('VirtualizedMessageList');
  const MessageUIComponent = MessageUIComponentProps || MessageUIComponentContext;

  const messageRenderer = useCallback(
    // @ts-ignore
    (virtuosoIndex: number, _, virtuosoContext: VirtuosoContext<StreamChatGenerics>) => {
      const {
        lastReceivedMessageId,
        numItemsPrepended,
        ownMessagesReadByOthers,
        processedMessages: messageList,
      } = virtuosoContext;
      const streamMessageIndex = virtuosoIndex + numItemsPrepended - prependOffset;

      if (customMessageRenderer) {
        return customMessageRenderer(messageList, streamMessageIndex);
      }

      const message = messageList[streamMessageIndex];

      if (!message) return <div style={{ height: '1px' }}></div>; // returning null or zero height breaks the virtuoso

      if (message.customType === CUSTOM_MESSAGE_TYPE.date && message.date && isDate(message.date)) {
        return <DateSeparator date={message.date} unread={message.unread} />;
      }

      if (message.type === 'system') {
        return <MessageSystem message={message} />;
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
          lastReceivedId={lastReceivedMessageId}
          message={message}
          Message={MessageUIComponent}
          messageActions={messageActions}
          readBy={ownMessagesReadByOthers[message.id] || []}
        />
      );
    },
    [
      additionalMessageInputProps,
      closeReactionSelectorOnClick,
      customMessageActions,
      customMessageRenderer,
      messageActions,
      shouldGroupByUser,
      prependOffset,
    ],
  );

  const virtuosoComponents: Partial<
    Components<VirtuosoContext<StreamChatGenerics>>
  > = useMemo(() => {
    // using 'display: inline-block'
    // traps CSS margins of the item elements, preventing incorrect item measurements
    const Item: Components<VirtuosoContext<StreamChatGenerics>>['Item'] = ({
      context,
      ...props
    }) => {
      if (!context) return <></>;

      const streamMessageIndex =
        props['data-item-index'] + context.numItemsPrepended - prependOffset;
      const message = context.processedMessages[streamMessageIndex];
      const groupStyles: GroupStyle = context.messageGroupStyles[message.id] || '';

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

    const EmptyPlaceholder: Components<
      VirtuosoContext<StreamChatGenerics>
    >['EmptyPlaceholder'] = () => (
      <>
        {EmptyStateIndicator && (
          <EmptyStateIndicator listType={threadList ? 'thread' : 'message'} />
        )}
      </>
    );

    const Header: Components<VirtuosoContext<StreamChatGenerics>>['Header'] = () =>
      loadingMore && !!LoadingIndicator ? (
        <div className='str-chat__virtual-list__loading'>
          <LoadingIndicator size={20} />
        </div>
      ) : (
        head || null
      );

    const Footer: Components<VirtuosoContext<StreamChatGenerics>>['Footer'] = () =>
      TypingIndicator ? <TypingIndicator avatarSize={24} /> : <></>;

    return {
      EmptyPlaceholder,
      Footer,
      Header,
      Item,
      ...virtuosoComponentsFromProps,
    };
  }, [
    EmptyStateIndicator,
    LoadingIndicator,
    TypingIndicator,
    loadingMore,
    head,
    threadList,
    virtuosoComponentsFromProps,
    prependOffset,
  ]);

  return { messageRenderer, virtuosoComponents };
};
