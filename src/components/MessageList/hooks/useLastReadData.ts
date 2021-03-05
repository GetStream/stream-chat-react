import { useMemo } from 'react';

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
} from '../../../../types/types';
import { getReadStates } from '../utils';

export const useLastReadData = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  userID: string | undefined,
  messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[],
  read?: Record<string, { last_read: Date; user: UserResponse<Us> }>,
) =>
  useMemo(
    () =>
      getReadStates(
        messages.filter(({ user }) => user?.id === userID),
        read,
      ),
    [userID, messages, read],
  );
