import { useMemo } from 'react';

import type { GetGroupStyles, ProcessMessagesParams } from '../../utils';
import { getMessageGroupStyles, insertIntro, processMessages } from '../../utils';

import { useChatContext } from '../../../../context/ChatContext';
import { useComponentContext } from '../../../../context/ComponentContext';

import type { Channel, LocalMessage, TimestampNS } from 'stream-chat';

export const useEnrichedMessages = (args: {
  channel: Channel;
  groupByUser: boolean;
  hideDeletedMessages: boolean;
  hideNewMessageSeparator: boolean;
  messages: LocalMessage[];
  withDateSeparator: boolean;
  getGroupStyles?: GetGroupStyles;
  headerPosition?: TimestampNS;
  maxTimeBetweenGroupedMessages?: number;
  reviewProcessedMessage?: ProcessMessagesParams['reviewProcessedMessage'];
}) => {
  const {
    channel,
    getGroupStyles,
    groupByUser,
    headerPosition,
    hideDeletedMessages,
    hideNewMessageSeparator,
    maxTimeBetweenGroupedMessages,
    messages,
    reviewProcessedMessage,
    withDateSeparator,
  } = args;

  const { client } = useChatContext();
  const { HeaderComponent } = useComponentContext();

  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);

  let messagesWithDates =
    !withDateSeparator && !hideDeletedMessages && hideNewMessageSeparator
      ? messages
      : processMessages({
          hideDeletedMessages,
          hideNewMessageSeparator,
          lastRead,
          messages,
          reviewProcessedMessage,
          userId: client.userID || '',
          withDateSeparator,
        });

  if (HeaderComponent) {
    messagesWithDates = insertIntro(messagesWithDates, headerPosition);
  }

  const messageGroupStyles = useMemo(
    () =>
      getMessageGroupStyles({
        getGroupStyles,
        groupByUser,
        maxTimeBetweenGroupedMessages,
        messages: messagesWithDates,
      }),
    [getGroupStyles, groupByUser, maxTimeBetweenGroupedMessages, messagesWithDates],
  );

  return { messageGroupStyles, messages: messagesWithDates };
};
