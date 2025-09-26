import { useMemo } from 'react';
import type { Channel, LocalMessage, UserResponse } from 'stream-chat';

type UseLastDeliveredDataParams = {
  channel: Channel;
  messages: LocalMessage[];
  returnAllReadData: boolean;
};

export const useLastDeliveredData = (props: UseLastDeliveredDataParams) => {
  const { channel, messages, returnAllReadData } = props;

  return useMemo(
    () =>
      returnAllReadData
        ? messages.reduce(
            (acc, msg) => {
              acc[msg.id] = channel.ownMessageReceiptsTracker.deliveredForMessage({
                msgId: msg.id,
                timestampMs: msg.created_at.getTime(),
              });
              return acc;
            },
            {} as Record<string, UserResponse[]>,
          )
        : channel.ownMessageReceiptsTracker.groupUsersByLastDeliveredMessage(),
    [channel, messages, returnAllReadData],
  );
};
