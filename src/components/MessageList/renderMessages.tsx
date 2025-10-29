import type { ReactNode } from 'react';
import React, { Fragment } from 'react';
import type { GroupStyle, RenderedMessage } from './utils';
import { getIsFirstUnreadMessage, isDateSeparatorMessage, isIntroMessage } from './utils';
import type { MessageProps } from '../Message';
import { Message } from '../Message';
import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { EventComponent as DefaultMessageSystem } from '../EventComponent';
import { UnreadMessagesSeparator as DefaultUnreadMessagesSeparator } from './UnreadMessagesSeparator';
import type { LocalMessage, UserResponse } from 'stream-chat';
import type { ComponentContextValue, CustomClasses } from '../../context';
import type { ChannelUnreadUiState } from '../../types';

export interface RenderMessagesOptions {
  components: ComponentContextValue;
  lastReceivedMessageId: string | null;
  messageGroupStyles: Record<string, GroupStyle>;
  messages: Array<RenderedMessage>;
  ownMessagesDeliveredToOthers: Record<string, UserResponse[]>;
  /**
   * Object mapping message IDs of own messages to the users who read those messages.
   */
  readData: Record<string, Array<UserResponse>>;
  /**
   * Props forwarded to the Message component.
   */
  sharedMessageProps: SharedMessageProps;
  /** Latest own message in currently displayed message set. */
  lastOwnMessage?: LocalMessage;
  /**
   * Current user's channel read state used to render components reflecting unread state.
   * It does not reflect the back-end state if a channel is marked read on mount.
   * This is in order to keep the unread UI when an unread channel is open.
   */
  channelUnreadUiState?: ChannelUnreadUiState;
  customClasses?: CustomClasses;
}

export type SharedMessageProps = Omit<MessageProps, MessagePropsToOmit>;

export type MessageRenderer = (options: RenderMessagesOptions) => Array<ReactNode>;

type MessagePropsToOmit =
  | 'channel'
  | 'deliveredTo'
  | 'groupStyles'
  | 'initialMessage'
  | 'lastReceivedId'
  | 'message'
  | 'readBy';

export function defaultRenderMessages({
  channelUnreadUiState,
  components,
  customClasses,
  lastOwnMessage,
  lastReceivedMessageId: lastReceivedId,
  messageGroupStyles,
  messages,
  ownMessagesDeliveredToOthers,
  readData,
  sharedMessageProps: messageProps,
}: RenderMessagesOptions) {
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
    } else if (isIntroMessage(message)) {
      if (HeaderComponent) {
        renderedMessages.push(
          <li key='intro'>
            <HeaderComponent />
          </li>,
        );
      }
    } else if (message.type === 'system') {
      renderedMessages.push(
        <li
          data-message-id={message.id}
          key={message.id || message.created_at.toISOString()}
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
        <Fragment key={message.id || message.created_at.toISOString()}>
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
              deliveredTo={ownMessagesDeliveredToOthers[message.id] || []}
              groupStyles={[groupStyles]} /* TODO: convert to simple string */
              lastOwnMessage={lastOwnMessage}
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
