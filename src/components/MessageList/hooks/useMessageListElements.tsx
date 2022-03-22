/* eslint-disable no-continue */
import React, { useMemo } from 'react';

import { useLastReadData } from './useLastReadData';
import { getLastReceived, GroupStyle } from '../utils';

import { DateSeparator as DefaultDateSeparator } from '../../DateSeparator/DateSeparator';
import { EventComponent } from '../../EventComponent/EventComponent';
import { Message } from '../../Message';

import { useChatContext } from '../../../context/ChatContext';
import { useComponentContext } from '../../../context/ComponentContext';
import { isDate } from '../../../context/TranslationContext';

import type { UserResponse } from 'stream-chat';

import type { MessageProps } from '../../Message/types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

type MessagePropsToOmit =
  | 'channel'
  | 'groupStyles'
  | 'initialMessage'
  | 'lastReceivedId'
  | 'message'
  | 'readBy'
  | 'threadList';

type UseMessageListElementsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  enrichedMessages: StreamMessage<StreamChatGenerics>[];
  internalMessageProps: Omit<MessageProps<StreamChatGenerics>, MessagePropsToOmit>;
  messageGroupStyles: Record<string, GroupStyle>;
  onMessageLoadCaptured: (event: React.SyntheticEvent<HTMLLIElement, Event>) => void;
  returnAllReadData: boolean;
  threadList: boolean;
  read?: Record<string, { last_read: Date; user: UserResponse<StreamChatGenerics> }>;
};

export const useMessageListElements = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: UseMessageListElementsProps<StreamChatGenerics>,
) => {
  const {
    enrichedMessages,
    internalMessageProps,
    messageGroupStyles,
    onMessageLoadCaptured,
    read,
    returnAllReadData,
    threadList,
  } = props;

  const { client, customClasses } = useChatContext<StreamChatGenerics>('useMessageListElements');
  const {
    DateSeparator = DefaultDateSeparator,
    HeaderComponent,
    MessageSystem = EventComponent,
  } = useComponentContext<StreamChatGenerics>('useMessageListElements');

  // get the readData, but only for messages submitted by the user themselves
  const readData = useLastReadData({
    messages: enrichedMessages,
    read,
    returnAllReadData,
    userID: client.userID,
  });

  const lastReceivedId = useMemo(() => getLastReceived(enrichedMessages), [enrichedMessages]);

  return useMemo(
    () =>
      enrichedMessages.map((message) => {
        if (message.customType === 'message.date' && message.date && isDate(message.date)) {
          return (
            <li key={`${message.date.toISOString()}-i`}>
              <DateSeparator
                date={message.date}
                formatDate={internalMessageProps.formatDate}
                unread={message.unread}
              />
            </li>
          );
        }

        if (message.customType === 'channel.intro' && HeaderComponent) {
          return (
            <li key='intro'>
              <HeaderComponent />
            </li>
          );
        }

        if (message.type === 'system') {
          return (
            <li
              key={
                (message.event as { created_at: string })?.created_at ||
                (message.created_at as string) ||
                ''
              }
            >
              <MessageSystem message={message} />
            </li>
          );
        }

        const groupStyles: GroupStyle = messageGroupStyles[message.id] || '';
        const messageClass = customClasses?.message || `str-chat__li str-chat__li--${groupStyles}`;

        return (
          <li
            className={messageClass}
            data-testid={messageClass}
            key={message.id || (message.created_at as string)}
            onLoadCapture={onMessageLoadCaptured}
          >
            <Message
              groupStyles={[groupStyles]} /* TODO: convert to simple string */
              lastReceivedId={lastReceivedId}
              message={message}
              readBy={readData[message.id] || []}
              threadList={threadList}
              {...internalMessageProps}
            />
          </li>
        );
      }),
    [
      enrichedMessages,
      internalMessageProps,
      lastReceivedId,
      messageGroupStyles,
      onMessageLoadCaptured,
      readData,
      threadList,
    ],
  );
};
