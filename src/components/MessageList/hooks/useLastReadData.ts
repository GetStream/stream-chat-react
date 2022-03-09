import { useMemo } from 'react';

import { getReadStates } from '../utils';

import type { UserResponse } from 'stream-chat';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

type UseLastReadDataParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  messages: StreamMessage<StreamChatGenerics>[];
  returnAllReadData: boolean;
  userID: string | undefined;
  read?: Record<string, { last_read: Date; user: UserResponse<StreamChatGenerics> }>;
};

export const useLastReadData = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: UseLastReadDataParams<StreamChatGenerics>,
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
