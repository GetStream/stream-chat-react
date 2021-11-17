import { useMemo } from 'react';

import { getGroupStyles, GroupStyle, insertIntro, processMessages } from '../utils';

import { useChatContext } from '../../../context/ChatContext';
import { useComponentContext } from '../../../context/ComponentContext';

import type { Channel } from 'stream-chat';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useEnrichedMessages = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(args: {
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  disableDateSeparator: boolean;
  groupStyles?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
    previousMessage: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
    nextMessage: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
    noGroupByUser: boolean,
  ) => GroupStyle;
  hideDeletedMessages: boolean;
  hideNewMessageSeparator: boolean;
  messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  noGroupByUser: boolean;
  threadList: boolean;
  headerPosition?: number;
}) => {
  const {
    channel,
    disableDateSeparator,
    groupStyles,
    headerPosition,
    hideDeletedMessages,
    hideNewMessageSeparator,
    messages,
    noGroupByUser,
    threadList,
  } = args;

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('useEnrichedMessages');
  const { HeaderComponent } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>(
    'useEnrichedMessages',
  );

  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);

  let messagesWithDates =
    disableDateSeparator && !hideDeletedMessages && hideNewMessageSeparator
      ? messages
      : processMessages({
          disableDateSeparator,
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

  const groupStylesFn = groupStyles ? groupStyles : getGroupStyles;
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
