import { useMemo } from 'react';

import { getGroupStyles, GroupStyle, insertDates, insertIntro } from '../utils';

import type { Channel, StreamChat } from 'stream-chat';

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
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  disableDateSeparator: boolean;
  hideDeletedMessages: boolean;
  hideNewMessageSeparator: boolean;
  messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  noGroupByUser: boolean;
  threadList: boolean;
  HeaderComponent?: React.ComponentType;
  headerPosition?: number;
}) => {
  const {
    channel,
    client,
    disableDateSeparator,
    HeaderComponent,
    headerPosition,
    hideDeletedMessages,
    hideNewMessageSeparator,
    messages,
    noGroupByUser,
    threadList,
  } = args;
  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);

  let messagesWithDates = threadList
    ? messages
    : insertDates(
        messages,
        lastRead,
        client.userID,
        hideDeletedMessages,
        disableDateSeparator,
        hideNewMessageSeparator,
      );

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
