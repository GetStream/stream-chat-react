import { useMemo } from 'react';
import type { Channel, LocalMessage, UserResponse } from 'stream-chat';

type UseLastReadDataParams = {
  channel: Channel;
  messages: LocalMessage[];
  returnAllReadData: boolean;
  lastOwnMessage?: LocalMessage;
};

export const useLastReadData = (props: UseLastReadDataParams) => {
  const { channel, lastOwnMessage, messages, returnAllReadData } = props;

  return useMemo(() => {
    if (returnAllReadData) {
      return messages.reduce(
        (acc, msg) => {
          acc[msg.id] = channel.messageReceiptsTracker.readersForMessage({
            msgId: msg.id,
            timestampMs: msg.created_at.getTime(),
          });
          return acc;
        },
        {} as Record<string, UserResponse[]>,
      );
    }

    if (!lastOwnMessage) return {};
    return {
      [lastOwnMessage.id]: channel.messageReceiptsTracker.readersForMessage({
        msgId: lastOwnMessage.id,
        timestampMs: lastOwnMessage.created_at.getTime(),
      }),
    };
  }, [channel, lastOwnMessage, messages, returnAllReadData]);
};
