import React, { Fragment, ReactNode } from 'react';

import type { UserResponse } from 'stream-chat';

import { getIsFirstUnreadMessage, GroupStyle, isDateSeparatorMessage } from './utils';
import { Message } from '../Message';
import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { EventComponent as DefaultMessageSystem } from '../EventComponent';
import { UnreadMessagesSeparator as DefaultUnreadMessagesSeparator } from './UnreadMessagesSeparator';
import { ComponentContextValue, CustomClasses } from '../../context';
import { CUSTOM_MESSAGE_TYPE } from '../../constants/messageTypes';

import type { ChannelUnreadUiState, DefaultStreamChatGenerics } from '../../types';
import type { StreamMessage } from '../../context/ChannelStateContext';
import type { MessageProps } from '../Message';

export interface RenderMessagesOptions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
  /**
   * Current user's channel read state used to render components reflecting unread state.
   * It does not reflect the back-end state if a channel is marked read on mount.
   * This is in order to keep the unread UI when an unread channel is open.
   */
  channelUnreadUiState?: ChannelUnreadUiState<StreamChatGenerics>;
  customClasses?: CustomClasses;
}

export type SharedMessageProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Omit<MessageProps<StreamChatGenerics>, MessagePropsToOmit>;

export type MessageRenderer<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = (options: RenderMessagesOptions<StreamChatGenerics>) => Array<ReactNode>;

type MessagePropsToOmit =
  | 'channel'
  | 'groupStyles'
  | 'initialMessage'
  | 'lastReceivedId'
  | 'message'
  | 'readBy';

export function defaultRenderMessages<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelUnreadUiState,
  components,
  customClasses,
  lastReceivedMessageId: lastReceivedId,
  messageGroupStyles,
  messages,
  readData,
  sharedMessageProps: messageProps,
}: RenderMessagesOptions<StreamChatGenerics>) {
  const {
    DateSeparator = DefaultDateSeparator,
    HeaderComponent,
    MessageSystem = DefaultMessageSystem,
    UnreadMessagesSeparator = DefaultUnreadMessagesSeparator,
  } = components;

  const renderedMessages = [];
  let firstMessage;
  let previousMessage = undefined;
  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    if (isDateSeparatorMessage(message)) {
      renderedMessages.push(
        <li key={`${message.date.toISOString()}-i`}>
          <DateSeparator
            date={message.date}
            formatDate={messageProps.formatDate}
            unread={message.unread}
          />
        </li>,
      );
    } else if (message.customType === CUSTOM_MESSAGE_TYPE.intro && HeaderComponent) {
      renderedMessages.push(
        <li key='intro'>
          <HeaderComponent />
        </li>,
      );
    } else if (message.type === 'system') {
      renderedMessages.push(
        <li
          data-message-id={message.id}
          key={message.id || (message.created_at as string)}
        >
          <MessageSystem message={message} />
        </li>,
      );
    } else {
      if (!firstMessage) {
        firstMessage = message;
      }
      const groupStyles: GroupStyle = messageGroupStyles[message.id] || '';
      const messageClass =
        customClasses?.message || `str-chat__li str-chat__li--${groupStyles}`;

      const isFirstUnreadMessage = getIsFirstUnreadMessage({
        firstUnreadMessageId: channelUnreadUiState?.first_unread_message_id,
        isFirstMessage: !!firstMessage?.id && firstMessage.id === message.id,
        lastReadDate: channelUnreadUiState?.last_read,
        lastReadMessageId: channelUnreadUiState?.last_read_message_id,
        message,
        previousMessage,
        unreadMessageCount: channelUnreadUiState?.unread_messages,
      });

      renderedMessages.push(
        <Fragment key={message.id || (message.created_at as string)}>
          {isFirstUnreadMessage && UnreadMessagesSeparator && (
            <li className='str-chat__li str-chat__unread-messages-separator-wrapper'>
              <UnreadMessagesSeparator
                unreadCount={channelUnreadUiState?.unread_messages}
              />
            </li>
          )}
          <li
            className={messageClass}
            data-message-id={message.id}
            data-testid={messageClass}
          >
            <Message
              groupStyles={[groupStyles]} /* TODO: convert to simple string */
              lastReceivedId={lastReceivedId}
              message={message}
              readBy={readData[message.id] || []}
              {...messageProps}
            />
          </li>
        </Fragment>,
      );
      previousMessage = message;
    }
  }
  return renderedMessages;
}
