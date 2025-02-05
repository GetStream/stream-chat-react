import { useMemo } from 'react';

import { getReadStates } from '../utils';

import type { UserResponse } from 'stream-chat';

import type { StreamMessage } from '../../../context/ChannelStateContext';

type UseLastReadDataParams = {
  messages: StreamMessage[];
  returnAllReadData: boolean;
  userID: string | undefined;
  read?: Record<string, { last_read: Date; user: UserResponse }>;
};

export const useLastReadData = (props: UseLastReadDataParams) => {
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
