import { useEffect } from 'react';
import {
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
} from '../../../context';
import type { Channel, Event, LocalMessage, MessageResponse } from 'stream-chat';
import { useThreadContext } from '../../Threads';

const hasReadLastMessage = (channel: Channel, userId: string) => {
  const latestMessageIdInChannel = channel.state.latestMessages.slice(-1)[0]?.id;
  const lastReadMessageIdServer = channel.state.read[userId]?.last_read_message_id;
  return latestMessageIdInChannel === lastReadMessageIdServer;
};

type UseMarkReadParams = {
  isMessageListScrolledToBottom: boolean;
  // todo: remove and infer only from useThreadContext return value - if undefined, not a thread list
  messageListIsThread: boolean;
};

/**
 * Takes care of marking a channel read. The channel is read only if all the following applies:
 * 1. the message list is not rendered in a thread
 * 2. the message list is scrolled to the bottom
 * 3. the channel was not marked unread by the user
 * @param isMessageListScrolledToBottom
 * @param messageListIsThread
 * @param wasChannelMarkedUnread
 */
export const useMarkRead = ({
  isMessageListScrolledToBottom,
  messageListIsThread,
}: UseMarkReadParams) => {
  const { client } = useChatContext();
  const { markRead } = useChannelActionContext();
  const { channel } = useChannelStateContext();
  const thread = useThreadContext();
  const { messagePaginator } = thread ?? channel;

  useEffect(() => {
    const shouldMarkRead = () => {
      const wasMarkedUnread =
        !!messagePaginator.unreadStateSnapshot.getLatestValue().firstUnreadMessageId;
      return (
        !document.hidden &&
        !wasMarkedUnread &&
        !messageListIsThread &&
        isMessageListScrolledToBottom &&
        client.user?.id &&
        !hasReadLastMessage(channel, client.user.id)
      );
    };

    const onVisibilityChange = () => {
      if (shouldMarkRead()) markRead();
    };

    const handleMessageNew = (event: Event) => {
      const mainChannelUpdated =
        !event.message?.parent_id || event.message?.show_in_channel;

      const wasMarkedUnread =
        !!messagePaginator.unreadStateSnapshot.getLatestValue().firstUnreadMessageId;

      // increase unread count in this case
      if (!isMessageListScrolledToBottom || wasMarkedUnread || document.hidden) {
        const currentUnreadSnapshot =
          messagePaginator.unreadStateSnapshot.getLatestValue();
        messagePaginator.unreadStateSnapshot.partialNext({
          unreadCount: currentUnreadSnapshot.unreadCount + 1,
        });
      } else if (mainChannelUpdated && shouldMarkRead()) {
        markRead();
      }
    };

    channel.on('message.new', handleMessageNew);
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (shouldMarkRead()) {
      markRead();
    }

    return () => {
      channel.off('message.new', handleMessageNew);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    channel,
    client,
    isMessageListScrolledToBottom,
    markRead,
    messageListIsThread,
    messagePaginator,
  ]);
};

function getPreviousLastMessage(messages: LocalMessage[], newMessage?: MessageResponse) {
  if (!newMessage) return;
  let previousLastMessage;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg?.id) break;
    if (msg.id !== newMessage.id) {
      previousLastMessage = msg;
      break;
    }
  }
  return previousLastMessage;
}
