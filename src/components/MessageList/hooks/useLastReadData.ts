import { useMemo } from 'react';

import { isLocalMessage } from '../utils';
import { getReadStates } from '../utils';

import type { LocalMessage, UserResponse } from 'stream-chat';
import type { RenderedMessage } from '../utils';

type UseLastReadDataParams = {
  messages: RenderedMessage[];
  returnAllReadData: boolean;
  userID: string | undefined;
  read?: Record<string, { last_read: Date; user: UserResponse }>;
};

export const useLastReadData = (props: UseLastReadDataParams) => {
  const { messages, read, returnAllReadData, userID } = props;

  return useMemo(() => {
    const ownLocalMessages = messages.filter(
      (msg) => isLocalMessage(msg) && msg.user?.id === userID,
    ) as LocalMessage[];
    return getReadStates(ownLocalMessages, read, returnAllReadData);
  }, [messages, read, returnAllReadData, userID]);
};
