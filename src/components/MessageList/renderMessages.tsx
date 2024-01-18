import React, { ReactNode } from 'react';

import { MessageProps } from '../Message/types';
import { StreamMessage } from '../../context/ChannelStateContext';
import { DefaultStreamChatGenerics } from '../../types/types';
import { ComponentContextValue, CustomClasses, isDate } from '../../context';
import { CUSTOM_MESSAGE_TYPE } from '../../constants/messageTypes';
import { GroupStyle } from './utils';
import { Message } from '../Message/Message';
import { UserResponse } from 'stream-chat';

export interface RenderMessagesOptions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> {
  components: ComponentContextValue<StreamChatGenerics>;
  lastReceivedMessageId: string | null;
  messageGroupStyles: Record<string, GroupStyle>;
  messages: Array<StreamMessage<StreamChatGenerics>>;
  readData: Record<string, Array<UserResponse<StreamChatGenerics>>>;
  sharedMessageProps: SharedMessageProps<StreamChatGenerics>;
  threadList: boolean;
  customClasses?: CustomClasses;
}

export type SharedMessageProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Omit<MessageProps<StreamChatGenerics>, MessagePropsToOmit>;

export type MessageRenderer<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = (options: RenderMessagesOptions<StreamChatGenerics>) => Array<ReactNode>;

type MessagePropsToOmit =
  | 'channel'
  | 'groupStyles'
  | 'initialMessage'
  | 'lastReceivedId'
  | 'message'
  | 'readBy'
  | 'threadList';

export function defaultRenderMessages<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  components,
  customClasses,
  lastReceivedMessageId: lastReceivedId,
  messageGroupStyles,
  messages,
  readData,
  sharedMessageProps: messageProps,
  threadList,
}: RenderMessagesOptions<StreamChatGenerics>) {
  const { DateSeparator, HeaderComponent, MessageSystem } = components;

  return messages.map((message) => {
    if (
      message.customType === CUSTOM_MESSAGE_TYPE.date &&
      message.date &&
      isDate(message.date) &&
      DateSeparator
    ) {
      return (
        <li key={`${message.date.toISOString()}-i`}>
          <DateSeparator
            date={message.date}
            formatDate={messageProps.formatDate}
            unread={message.unread}
          />
        </li>
      );
    }

    if (message.customType === CUSTOM_MESSAGE_TYPE.intro && HeaderComponent) {
      return (
        <li key='intro'>
          <HeaderComponent />
        </li>
      );
    }

    if (message.type === 'system' && MessageSystem) {
      return (
        <li key={message.id || (message.created_at as string)}>
          <MessageSystem message={message} />
        </li>
      );
    }

    const groupStyles: GroupStyle = messageGroupStyles[message.id] || '';
    const messageClass = customClasses?.message || `str-chat__li str-chat__li--${groupStyles}`;

    return (
      <li
        className={messageClass}
        data-message-id={message.id}
        data-testid={messageClass}
        key={message.id || (message.created_at as string)}
      >
        <Message
          groupStyles={[groupStyles]} /* TODO: convert to simple string */
          lastReceivedId={lastReceivedId}
          message={message}
          readBy={readData[message.id] || []}
          threadList={threadList}
          {...messageProps}
        />
      </li>
    );
  });
}
