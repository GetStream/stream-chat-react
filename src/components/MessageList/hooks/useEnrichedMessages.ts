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

  const messageGroupStyles = useMemo(
    () =>
      messagesWithDates.reduce((acc, message, i) => {
        const style = getGroupStyles(
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
