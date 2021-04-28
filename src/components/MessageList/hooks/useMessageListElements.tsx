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

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../../types/types';

type MessagePropsToOmit =
  | 'channel'
  | 'groupStyles'
  | 'initialMessage'
  | 'lastReceivedId'
  | 'message'
  | 'readBy'
  | 'threadList';

type UseMessageListElementsProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  enrichedMessages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  messageGroupStyles: Record<string, GroupStyle>;
  onMessageLoadCaptured: (event: React.SyntheticEvent<HTMLLIElement, Event>) => void;
  threadList: boolean;
  internalMessageProps?: Omit<MessageProps<At, Ch, Co, Ev, Me, Re, Us>, MessagePropsToOmit>;
  read?: Record<string, { last_read: Date; user: UserResponse<Us> }>;
};

export const useMessageListElements = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: UseMessageListElementsProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    enrichedMessages,
    internalMessageProps,
    messageGroupStyles,
    onMessageLoadCaptured,
    read,
    threadList,
  } = props;

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    DateSeparator = DefaultDateSeparator,
    HeaderComponent,
    MessageSystem = EventComponent,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

  // get the readData, but only for messages submitted by the user themselves
  const readData = useLastReadData(client.userID, enrichedMessages, read);

  const lastReceivedId = useMemo(() => getLastReceived(enrichedMessages), [enrichedMessages]);

  return useMemo(
    () =>
      enrichedMessages.map((message) => {
        if (message.type === 'message.date' && message.date && isDate(message.date)) {
          return (
            <li key={`${message.date.toISOString()}-i`}>
              <DateSeparator date={message.date} unread={message.unread} />
            </li>
          );
        }

        if (message.type === 'channel.intro' && HeaderComponent) {
          return (
            <li key='intro'>
              <HeaderComponent />
            </li>
          );
        }

        if (message.type === 'channel.event' || message.type === 'system') {
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

        if (message.type !== 'message.read') {
          const groupStyles: GroupStyle = messageGroupStyles[message.id] || '';

          return (
            <li
              className={`str-chat__li str-chat__li--${groupStyles}`}
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
        }

        return null;
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
