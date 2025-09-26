import { useCallback, useEffect, useState } from 'react';
import type { Channel, Event, LocalMessage, UserResponse } from 'stream-chat';

import { useChatContext } from '../../../context';

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

export const useMessageDeliveryStatus = ({
  channel,
  lastMessage,
}: UseMessageStatusParamsChannelPreviewProps) => {
  const { client } = useChatContext();
  const [messageDeliveryStatus, setMessageDeliveryStatus] = useState<
    MessageDeliveryStatus | undefined
  >();

  const isOwnMessage = useCallback(
    (message?: { user?: UserResponse | null }) =>
      client.user && message && message.user?.id === client.user.id,
    [client],
  );

  useEffect(() => {
    // empty channel
    if (!lastMessage) {
      setMessageDeliveryStatus(undefined);
    }

    const lastMessageIsOwn = isOwnMessage(lastMessage);
    if (!lastMessage?.created_at || !lastMessageIsOwn) return;

    const msgRef = {
      msgId: lastMessage.id,
      timestampMs: lastMessage.created_at.getTime(),
    };
    setMessageDeliveryStatus(
      channel.ownMessageReceiptsTracker.readersForMessage(msgRef).length > 0
        ? MessageDeliveryStatus.READ
        : channel.ownMessageReceiptsTracker.deliveredForMessage(msgRef).length > 0
          ? MessageDeliveryStatus.DELIVERED
          : MessageDeliveryStatus.SENT,
    );
  }, [channel, isOwnMessage, lastMessage]);

  useEffect(() => {
    const handleMessageNew = (event: Event) => {
      // the last message is not mine, so do not show the delivery status
      if (!isOwnMessage(event.message)) {
        return setMessageDeliveryStatus(undefined);
      }
      return setMessageDeliveryStatus(MessageDeliveryStatus.SENT);
    };

    channel.on('message.new', handleMessageNew);

    return () => {
      channel.off('message.new', handleMessageNew);
    };
  }, [channel, isOwnMessage]);

  useEffect(() => {
    if (!isOwnMessage(lastMessage)) return;
    const handleMessageDelivered = (event: Event) => {
      if (
        event.user?.id !== client.user?.id &&
        lastMessage &&
        lastMessage.id === event.last_delivered_message_id
      )
        setMessageDeliveryStatus(MessageDeliveryStatus.DELIVERED);
    };

    const handleMarkRead = (event: Event) => {
      if (event.user?.id !== client.user?.id)
        setMessageDeliveryStatus(MessageDeliveryStatus.READ);
    };

    channel.on('message.delivered', handleMessageDelivered);
    channel.on('message.read', handleMarkRead);

    return () => {
      channel.off('message.delivered', handleMessageDelivered);
      channel.off('message.read', handleMarkRead);
    };
  }, [channel, client, isOwnMessage, lastMessage]);

  return {
    messageDeliveryStatus,
  };
};
