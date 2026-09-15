import { useMemo } from 'react';

import type { GroupStyle, ProcessMessagesParams, RenderedMessage } from '../../utils';
import { getGroupStyles, insertIntro, processMessages } from '../../utils';

import { useChatContext } from '../../../../context/ChatContext';
import { useComponentContext } from '../../../../context/ComponentContext';

import type { Channel, LocalMessage } from 'stream-chat';

export const useEnrichedMessages = (args: {
  channel: Channel;
  hideDeletedMessages: boolean;
  hideNewMessageSeparator: boolean;
  messages: LocalMessage[];
  noGroupByUser: boolean;
  withDateSeparator: boolean;
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
    groupStyles,
    headerPosition,
    hideDeletedMessages,
    hideNewMessageSeparator,
    maxTimeBetweenGroupedMessages,
    messages,
    noGroupByUser,
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
