import { useMemo } from 'react';

import {
  getGroupStyles,
  GroupStyle,
  insertIntro,
  processMessages,
  ProcessMessagesParams,
} from '../../utils';

import { useChatContext } from '../../../../context/ChatContext';
import { useComponentContext } from '../../../../context/ComponentContext';

import type { Channel } from 'stream-chat';

import type { StreamMessage } from '../../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

export const useEnrichedMessages = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(args: {
  channel: Channel<StreamChatGenerics>;
  disableDateSeparator: boolean;
  hideDeletedMessages: boolean;
  hideNewMessageSeparator: boolean;
  messages: StreamMessage<StreamChatGenerics>[];
  noGroupByUser: boolean;
  groupStyles?: (
    message: StreamMessage<StreamChatGenerics>,
    previousMessage: StreamMessage<StreamChatGenerics>,
    nextMessage: StreamMessage<StreamChatGenerics>,
    noGroupByUser: boolean,
    maxTimeBetweenGroupedMessages?: number,
  ) => GroupStyle;
  headerPosition?: number;
  maxTimeBetweenGroupedMessages?: number;
  reviewProcessedMessage?: ProcessMessagesParams<StreamChatGenerics>['reviewProcessedMessage'];
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

  const { client } = useChatContext<StreamChatGenerics>('useEnrichedMessages');
  const { HeaderComponent } =
    useComponentContext<StreamChatGenerics>('useEnrichedMessages');

  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);

  const enableDateSeparator = !disableDateSeparator;

  let messagesWithDates =
    !enableDateSeparator && !hideDeletedMessages && hideNewMessageSeparator
      ? messages
      : processMessages<StreamChatGenerics>({
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
