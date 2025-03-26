import { useMemo } from 'react';

import type { GroupStyle, ProcessMessagesParams, RenderedMessage } from '../../utils';
import { getGroupStyles, insertIntro, processMessages } from '../../utils';

import { useChatContext } from '../../../../context/ChatContext';
import { useComponentContext } from '../../../../context/ComponentContext';

import type { Channel, LocalMessage } from 'stream-chat';

export const useEnrichedMessages = (args: {
  channel: Channel;
  disableDateSeparator: boolean;
  hideDeletedMessages: boolean;
  hideNewMessageSeparator: boolean;
  messages: LocalMessage[];
  noGroupByUser: boolean;
  groupStyles?: (
    message: RenderedMessage,
    previousMessage: RenderedMessage,
    nextMessage: RenderedMessage,
    noGroupByUser: boolean,
    maxTimeBetweenGroupedMessages?: number,
  ) => GroupStyle;
  headerPosition?: number;
  maxTimeBetweenGroupedMessages?: number;
  reviewProcessedMessage?: ProcessMessagesParams['reviewProcessedMessage'];
}) => {
  const {
    channel,
    disableDateSeparator,
    groupStyles,
    headerPosition,
    hideDeletedMessages,
    hideNewMessageSeparator,
    maxTimeBetweenGroupedMessages,
    messages,
    noGroupByUser,
    reviewProcessedMessage,
  } = args;

  const { client } = useChatContext('useEnrichedMessages');
  const { HeaderComponent } = useComponentContext('useEnrichedMessages');

  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);

  const enableDateSeparator = !disableDateSeparator;

  let messagesWithDates =
    !enableDateSeparator && !hideDeletedMessages && hideNewMessageSeparator
      ? messages
      : processMessages({
          enableDateSeparator,
          hideDeletedMessages,
          hideNewMessageSeparator,
          lastRead,
          messages,
          reviewProcessedMessage,
          userId: client.userID || '',
        });

  if (HeaderComponent) {
    messagesWithDates = insertIntro(messagesWithDates, headerPosition);
  }

  const groupStylesFn = groupStyles || getGroupStyles;
  const messageGroupStyles = useMemo(
    () =>
      messagesWithDates.reduce<Record<string, GroupStyle>>((acc, message, i) => {
        const style = groupStylesFn(
          message,
          messagesWithDates[i - 1],
          messagesWithDates[i + 1],
          noGroupByUser,
          maxTimeBetweenGroupedMessages,
        );
        if (style) acc[message.id] = style;
        return acc;
      }, {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxTimeBetweenGroupedMessages, messagesWithDates, noGroupByUser],
  );

  return { messageGroupStyles, messages: messagesWithDates };
};
