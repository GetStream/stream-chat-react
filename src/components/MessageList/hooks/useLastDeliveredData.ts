import { useCallback, useEffect, useState } from 'react';
import type { Channel, LocalMessage, UserResponse } from 'stream-chat';

type UseLastDeliveredDataParams = {
  channel: Channel;
  messages: LocalMessage[];
  returnAllReadData: boolean;
  lastOwnMessage?: LocalMessage;
};

export const useLastDeliveredData = (
  props: UseLastDeliveredDataParams,
): Record<string, UserResponse[]> => {
  const { channel, lastOwnMessage, messages, returnAllReadData } = props;

  const calculateForAll = useCallback(
    () =>
      messages.reduce(
        (acc, msg) => {
          acc[msg.id] = channel.messageReceiptsTracker.deliveredForMessage({
            msgId: msg.id,
            timestampMs: msg.created_at.getTime(),
          });
          return acc;
        },
        {} as Record<string, UserResponse[]>,
      ),
    [channel, messages],
  );

  const calculateForLastOwn = useCallback(() => {
    if (!lastOwnMessage) return {};
    return {
      [lastOwnMessage.id]: channel.messageReceiptsTracker.deliveredForMessage({
        msgId: lastOwnMessage.id,
        timestampMs: lastOwnMessage.created_at.getTime(),
      }),
    };
  }, [channel, lastOwnMessage]);

  const [deliveredTo, setDeliveredTo] = useState<Record<string, UserResponse[]>>(
    returnAllReadData ? calculateForAll : calculateForLastOwn,
  );

  useEffect(() => {
    if (!returnAllReadData) return;
    setDeliveredTo(calculateForAll);
    return channel.on('message.delivered', () => setDeliveredTo(calculateForAll))
      .unsubscribe;
  }, [channel, calculateForAll, returnAllReadData]);

  useEffect(() => {
    if (returnAllReadData) return;
    else setDeliveredTo(calculateForLastOwn);
    return channel.on('message.delivered', () => setDeliveredTo(calculateForLastOwn))
      .unsubscribe;
  }, [channel, calculateForLastOwn, returnAllReadData]);

  return deliveredTo;
};
