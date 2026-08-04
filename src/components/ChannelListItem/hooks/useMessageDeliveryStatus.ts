import { useCallback, useMemo } from 'react';
import type {
  Channel,
  LocalMessage,
  MessageReceiptsSnapshot,
  UserResponse,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store/hooks/useStateStore';

export enum MessageDeliveryStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

type UseMessageStatusParamsChannelPreviewProps = {
  channel: Channel;
  /** The last message received in a channel */
  lastMessage?: LocalMessage;
};

const trackerSnapshotSelector = (next: MessageReceiptsSnapshot) => ({
  deliveredByMessageId: next.deliveredByMessageId,
  readersByMessageId: next.readersByMessageId,
  revision: next.revision,
});

export const useMessageDeliveryStatus = ({
  channel,
  lastMessage,
}: UseMessageStatusParamsChannelPreviewProps) => {
  const { client } = useChatContext();
  const trackerSnapshot = useStateStore(
    channel.messageReceiptsTracker.snapshotStore,
    trackerSnapshotSelector,
  );

  const isOwnMessage = useCallback(
    (message?: { user?: UserResponse | null }) =>
      client.user && message && message.user?.id === client.user.id,
    [client],
  );

  const messageDeliveryStatus = useMemo(() => {
    // empty channel
    if (!lastMessage) return undefined;

    const lastMessageIsOwn = isOwnMessage(lastMessage);
    if (!lastMessageIsOwn) return undefined;

    const readersForMessage = trackerSnapshot?.readersByMessageId[lastMessage.id] ?? [];
    const deliveredForMessage =
      trackerSnapshot?.deliveredByMessageId[lastMessage.id] ?? [];

    return readersForMessage.length > 1 ||
      (readersForMessage.length === 1 && readersForMessage[0].id !== client.user?.id)
      ? MessageDeliveryStatus.READ
      : deliveredForMessage.length > 1 ||
          (deliveredForMessage.length === 1 &&
            deliveredForMessage[0].id !== client.user?.id)
        ? MessageDeliveryStatus.DELIVERED
        : MessageDeliveryStatus.SENT;
  }, [client.user?.id, isOwnMessage, lastMessage, trackerSnapshot]);

  return {
    messageDeliveryStatus,
  };
};
