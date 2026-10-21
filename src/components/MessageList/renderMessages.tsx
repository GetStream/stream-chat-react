import type { ReactNode } from 'react';
import React, { Fragment } from 'react';
import type { GroupStyle, RenderedMessage } from './utils';
import { getIsFirstUnreadMessage, isDateSeparatorMessage, isIntroMessage } from './utils';
import type { MessageProps } from '../Message';
import { Message } from '../Message';
import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { EventComponent as DefaultMessageSystem } from '../EventComponent';
import { UnreadMessagesSeparator as DefaultUnreadMessagesSeparator } from './UnreadMessagesSeparator';
import type {
  Channel,
  LocalMessage,
  UnreadSnapshotState,
  UserResponse,
} from 'stream-chat';
import type { ComponentContextValue, CustomClasses } from '../../context';

export interface RenderMessagesOptions {
  channel: Channel;
  /**
   * Unread snapshot the unread UI renders from. It is not updated when the channel is marked read
   * on mount, so an unread channel keeps its unread UI while it is open.
   */
  channelUnreadUiState: UnreadSnapshotState;
  components: ComponentContextValue;
  lastReceivedMessageId: string | null;
  messageGroupStyles: Record<string, GroupStyle>;
  messages: Array<RenderedMessage>;
  ownMessagesDeliveredToOthers: Record<string, UserResponse[]>;
  /** ID of the message the paginator currently signals for focus. */
  focusedMessageId?: string | null;
  /** Message IDs mapped to the users who read each message. */
  readData: Record<string, Array<UserResponse>>;
  /** Props forwarded to the `Message` component. */
  sharedMessageProps: SharedMessageProps;
  /** Latest own message in the displayed message set. */
  lastOwnMessage?: LocalMessage;
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
  channel,
  channelUnreadUiState,
  components,
  customClasses,
  focusedMessageId,
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
    MessageListItem = 'li',
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
        <MessageListItem data-index={index} key={`${message.date.toISOString()}-i`}>
          <DateSeparator
            date={message.date}
            formatDate={messageProps.formatDate}
            unread={message.unread}
          />
        </MessageListItem>,
      );
    } else if (isIntroMessage(message)) {
      if (HeaderComponent) {
        renderedMessages.push(
          <MessageListItem data-index={index} key='intro'>
            <HeaderComponent />
          </MessageListItem>,
        );
      }
    } else if (message.type === 'system') {
      renderedMessages.push(
        <MessageListItem
          data-index={index}
          data-message-id={message.id}
          key={message.id || String(message.created_at)}
        >
          <MessageSystem message={message} unsafeHTML={messageProps.unsafeHTML} />
        </MessageListItem>,
      );
    } else {
      if (!firstMessage) {
        firstMessage = message;
      }
      const groupStyles: GroupStyle = messageGroupStyles[message.id] || '';
      const messageClass =
        customClasses?.message || `str-chat__li str-chat__li--${groupStyles}`;

      const isFirstUnreadMessage = getIsFirstUnreadMessage({
        ...channelUnreadUiState,
        channel,
        firstUnreadMessageId: channelUnreadUiState?.firstUnreadMessageId,
        isFirstMessage: !!firstMessage?.id && firstMessage.id === message.id,
        message,
        previousMessage,
      });

      renderedMessages.push(
        <Fragment key={message.id || String(message.created_at)}>
          {isFirstUnreadMessage && UnreadMessagesSeparator && (
            <MessageListItem className='str-chat__li str-chat__unread-messages-separator-wrapper'>
              <UnreadMessagesSeparator unreadCount={channelUnreadUiState?.unreadCount} />
            </MessageListItem>
          )}
          <MessageListItem
            className={messageClass}
            data-index={index}
            data-message-id={message.id}
            data-testid={messageClass}
          >
            <Message
              deliveredTo={ownMessagesDeliveredToOthers[message.id] || []}
              groupStyles={[groupStyles]} /* TODO: convert to simple string */
              highlighted={focusedMessageId === message.id}
              lastOwnMessage={lastOwnMessage}
              lastReceivedId={lastReceivedId}
              message={message}
              readBy={readData[message.id] || []}
              {...messageProps}
            />
          </MessageListItem>
        </Fragment>,
      );
      previousMessage = message;
    }
  }
  return renderedMessages;
}
