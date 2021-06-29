import { useMemo } from 'react';

import { getReadStates } from '../utils';

import type { UserResponse } from 'stream-chat';

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

type UseLastReadDataParams<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  returnAllReadData: boolean;
  userID: string | undefined;
  read?: Record<string, { last_read: Date; user: UserResponse<Us> }>;
};

export const useLastReadData = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: UseLastReadDataParams<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { messages, read, returnAllReadData, userID } = props;

  return useMemo(
    () =>
      getReadStates(
        messages.filter(({ user }) => user?.id === userID),
        read,
        returnAllReadData,
      ),
    [messages, read, returnAllReadData, userID],
  );
};
