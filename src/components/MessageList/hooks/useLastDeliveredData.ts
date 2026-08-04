import { useMemo } from 'react';
import type { Channel, LocalMessage, UserResponse } from 'stream-chat';

import { useStateStore } from '../../../store/hooks/useStateStore';

type UseLastDeliveredDataParams = {
  channel: Channel;
  messages: LocalMessage[];
  returnAllReadData: boolean;
  lastOwnMessage?: LocalMessage;
};

const trackerSnapshotSelector = (next: {
  deliveredByMessageId: Record<string, UserResponse[]>;
  revision: number;
}) => ({
  deliveredByMessageId: next.deliveredByMessageId,
  revision: next.revision,
});

export const useLastDeliveredData = (
  props: UseLastDeliveredDataParams,
): Record<string, UserResponse[]> => {
  const { channel, lastOwnMessage, returnAllReadData } = props;
  const trackerSnapshot = useStateStore(
    channel.messageReceiptsTracker.snapshotStore,
    trackerSnapshotSelector,
  );

  return useMemo(() => {
    const deliveredByMessageId = trackerSnapshot?.deliveredByMessageId ?? {};

    if (returnAllReadData) return deliveredByMessageId;

    if (!lastOwnMessage) return {};
    return {
      [lastOwnMessage.id]: deliveredByMessageId[lastOwnMessage.id] ?? [],
    };
  }, [lastOwnMessage, returnAllReadData, trackerSnapshot]);
};
