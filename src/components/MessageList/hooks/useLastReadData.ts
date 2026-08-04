import { useMemo } from 'react';
import type { Channel, LocalMessage, MessageReceiptsSnapshot } from 'stream-chat';

import { useStateStore } from '../../../store/hooks/useStateStore';

type UseLastReadDataParams = {
  channel: Channel;
  messages: LocalMessage[];
  returnAllReadData: boolean;
  lastOwnMessage?: LocalMessage;
};

const trackerSnapshotSelector = (next: MessageReceiptsSnapshot) => ({
  readersByMessageId: next.readersByMessageId,
  revision: next.revision,
});

export const useLastReadData = (props: UseLastReadDataParams) => {
  const { channel, lastOwnMessage, returnAllReadData } = props;
  const trackerSnapshot = useStateStore(
    channel.messageReceiptsTracker.snapshotStore,
    trackerSnapshotSelector,
  );

  return useMemo(() => {
    const readersByMessageId = trackerSnapshot?.readersByMessageId ?? {};

    if (returnAllReadData) return readersByMessageId;

    if (!lastOwnMessage) return {};
    return {
      [lastOwnMessage.id]: readersByMessageId[lastOwnMessage.id] ?? [],
    };
  }, [lastOwnMessage, returnAllReadData, trackerSnapshot]);
};
