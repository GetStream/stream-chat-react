import { useMemo } from 'react';

import { getGroupStyles, GroupStyle, insertIntro, processMessages } from '../utils';

import { useChatContext } from '../../../context/ChatContext';
import { useComponentContext } from '../../../context/ComponentContext';

import type { Channel } from 'stream-chat';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useEnrichedMessages = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(args: {
  channel: Channel<StreamChatGenerics>;
  disableDateSeparator: boolean;
  enableThreadDateSeparator: boolean;
  hideDeletedMessages: boolean;
  hideNewMessageSeparator: boolean;
  messages: StreamMessage<StreamChatGenerics>[];
  noGroupByUser: boolean;
  threadList: boolean;
  groupStyles?: (
    message: StreamMessage<StreamChatGenerics>,
    previousMessage: StreamMessage<StreamChatGenerics>,
    nextMessage: StreamMessage<StreamChatGenerics>,
    noGroupByUser: boolean,
  ) => GroupStyle;
  headerPosition?: number;
}) => {
  const {
    channel,
    disableDateSeparator,
    enableThreadDateSeparator,
    groupStyles,
    headerPosition,
    hideDeletedMessages,
    hideNewMessageSeparator,
    messages,
    noGroupByUser,
    threadList,
  } = args;

  const { client } = useChatContext<StreamChatGenerics>('useEnrichedMessages');
  const { HeaderComponent } = useComponentContext<StreamChatGenerics>('useEnrichedMessages');

  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);
// todo add enable
  let messagesWithDates =
    disableDateSeparator && !hideDeletedMessages && hideNewMessageSeparator
      ? messages
      : processMessages({
          disableDateSeparator,
          enableThreadDateSeparator,
          hideDeletedMessages,
          hideNewMessageSeparator,
          lastRead,
          messages,
          threadList,
          userId: client.userID || '',
        });

  if (HeaderComponent) {
    messagesWithDates = insertIntro(messagesWithDates, headerPosition);
  }

  const groupStylesFn = groupStyles || getGroupStyles;
  const messageGroupStyles = useMemo(
    () =>
      messagesWithDates.reduce((acc, message, i) => {
        const style = groupStylesFn(
          message,
          messagesWithDates[i - 1],
          messagesWithDates[i + 1],
          noGroupByUser,
        );
        if (style) acc[message.id] = style;
        return acc;
      }, {} as Record<string, GroupStyle>),
    [messagesWithDates, noGroupByUser],
  );

  return { messageGroupStyles, messages: messagesWithDates };
};
