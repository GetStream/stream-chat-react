import { useCallback, useMemo } from 'react';
import type {
  Channel,
  LocalMessage,
  MessageReceiptsSnapshot,
  MsgRef,
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

/** Whether a cursor has reached this message. */
const hasCursorReached = (message: LocalMessage, cursor: MsgRef | null) =>
  !!cursor && message.created_at <= cursor.timestamp;

const trackerSnapshotSelector = (next: MessageReceiptsSnapshot) => ({
  lastDeliveredRefByOthers: next.lastDeliveredRefByOthers,
  lastReadRefByOthers: next.lastReadRefByOthers,
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

    // Read against the cursors rather than asking who sits on this message: a member whose cursor
    // is behind the latest message has still received everything up to it, and the old lookup
    // reported that as `SENT`.
    if (hasCursorReached(lastMessage, trackerSnapshot?.lastReadRefByOthers ?? null)) {
      return MessageDeliveryStatus.READ;
    }
    if (
      hasCursorReached(lastMessage, trackerSnapshot?.lastDeliveredRefByOthers ?? null)
    ) {
      return MessageDeliveryStatus.DELIVERED;
    }
    return MessageDeliveryStatus.SENT;
  }, [isOwnMessage, lastMessage, trackerSnapshot]);

  return {
    messageDeliveryStatus,
  };
};
