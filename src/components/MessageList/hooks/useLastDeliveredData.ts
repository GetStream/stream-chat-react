import { useCallback, useEffect, useState } from 'react';
import type { Channel, LocalMessage, UserResponse } from 'stream-chat';

type UseLastDeliveredDataParams = {
  channel: Channel;
  messages: LocalMessage[];
  returnAllReadData: boolean;
};

export const useLastDeliveredData = (
  props: UseLastDeliveredDataParams,
): Record<string, UserResponse[]> => {
  const { channel, messages, returnAllReadData } = props;
  const calculate = useCallback(
    () =>
      returnAllReadData
        ? messages.reduce(
            (acc, msg) => {
              acc[msg.id] = channel.messageReceiptsTracker.deliveredForMessage({
                msgId: msg.id,
                timestampMs: msg.created_at.getTime(),
              });
              return acc;
            },
            {} as Record<string, UserResponse[]>,
          )
        : channel.messageReceiptsTracker.groupUsersByLastDeliveredMessage(),
    [channel, messages, returnAllReadData],
  );

  const [deliveredTo, setDeliveredTo] =
    useState<Record<string, UserResponse[]>>(calculate);

  useEffect(
    () => channel.on('message.delivered', () => setDeliveredTo(calculate)).unsubscribe,
    [channel, calculate],
  );

  return deliveredTo;
};
