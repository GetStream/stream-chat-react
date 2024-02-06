import React, { Fragment, ReactNode } from 'react';

import { MessageProps } from '../Message/types';
import { StreamMessage } from '../../context/ChannelStateContext';
import { DefaultStreamChatGenerics } from '../../types/types';
import { ComponentContextValue, CustomClasses, isDate } from '../../context';
import { CUSTOM_MESSAGE_TYPE } from '../../constants/messageTypes';
import { GroupStyle } from './utils';
import { Message } from '../Message/Message';
import { ChannelState as StreamChannelState, UserResponse } from 'stream-chat';

export interface RenderMessagesOptions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> {
  components: ComponentContextValue<StreamChatGenerics>;
  lastReceivedMessageId: string | null;
  messageGroupStyles: Record<string, GroupStyle>;
  messages: Array<StreamMessage<StreamChatGenerics>>;
  /**
   * Object mapping message IDs of own messages to the users who read those messages.
   */
  readData: Record<string, Array<UserResponse<StreamChatGenerics>>>;
  /**
   * Props forwarded to the Message component.
   */
  sharedMessageProps: SharedMessageProps<StreamChatGenerics>;
  customClasses?: CustomClasses;
  /**
   * Current user's read status.
   * Useful to determine, when a channel has been marked read the last time, the last read message, count of unread messages.
   */
  ownReadState?: StreamChannelState<StreamChatGenerics>['read'][keyof StreamChannelState<StreamChatGenerics>['read']];
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
  | 'readBy';

export function defaultRenderMessages<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  components,
  customClasses,
  lastReceivedMessageId: lastReceivedId,
  messageGroupStyles,
  messages,
  ownReadState,
  readData,
  sharedMessageProps: messageProps,
}: RenderMessagesOptions<StreamChatGenerics>) {
  const { DateSeparator, HeaderComponent, MessageSystem, UnreadMessagesSeparator } = components;

  return messages.map((message, index) => {
    if (message.customType === CUSTOM_MESSAGE_TYPE.date && message.date && isDate(message.date)) {
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

    if (message.type === 'system') {
      return (
        <li key={message.id || (message.created_at as string)}>
          <MessageSystem message={message} />
        </li>
      );
    }

    const groupStyles: GroupStyle = messageGroupStyles[message.id] || '';
    const messageClass = customClasses?.message || `str-chat__li str-chat__li--${groupStyles}`;

    const isNewestMessage = index === messages.length - 1;
    const isLastReadMessage = ownReadState?.last_read_message_id === message.id;
    const showUnreadSeparator =
      isLastReadMessage &&
      !isNewestMessage &&
      (ownReadState?.first_unread_message_id || ownReadState?.unread_messages > 0); // unread count can be 0 if the user marks unread only own messages

    return (
      <Fragment key={message.id || (message.created_at as string)}>
        <li className={messageClass} data-message-id={message.id} data-testid={messageClass}>
          <Message
            groupStyles={[groupStyles]} /* TODO: convert to simple string */
            lastReceivedId={lastReceivedId}
            message={message}
            readBy={readData[message.id] || []}
            {...messageProps}
          />
        </li>
        {showUnreadSeparator && UnreadMessagesSeparator && (
          <li className='str-chat__li str-chat__unread-messages-separator-wrapper'>
            <UnreadMessagesSeparator unreadCount={ownReadState.unread_messages} />
          </li>
        )}
      </Fragment>
    );
  });
}
