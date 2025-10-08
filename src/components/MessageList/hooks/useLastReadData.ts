import { useMemo } from 'react';
import type { Channel, LocalMessage, UserResponse } from 'stream-chat';

type UseLastReadDataParams = {
  channel: Channel;
  messages: LocalMessage[];
  returnAllReadData: boolean;
};

export const useLastReadData = (props: UseLastReadDataParams) => {
  const { channel, messages, returnAllReadData } = props;

  return useMemo(
    () =>
      returnAllReadData
        ? messages.reduce(
            (acc, msg) => {
              acc[msg.id] = channel.messageReceiptsTracker.readersForMessage({
                msgId: msg.id,
                timestampMs: msg.created_at.getTime(),
              });
              return acc;
            },
            {} as Record<string, UserResponse[]>,
          )
        : channel.messageReceiptsTracker.groupUsersByLastReadMessage(),
    [channel, messages, returnAllReadData],
  );
};
