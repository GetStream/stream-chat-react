import { useCallback, useEffect } from 'react';
import { useChannel, useChatContext } from '../../../context';
import { useMessagePaginator } from '../../../hooks';
import { useThreadContext } from '../../Threads';
import type { Channel, Event } from 'stream-chat';

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
 * Takes care of marking the active message collection read (channel or thread).
 * The collection is marked read only if:
 * 1. the list is scrolled to the bottom
 * 2. it was not explicitly marked unread by the user
 */
export const useMarkRead = ({
  isMessageListScrolledToBottom,
  messageListIsThread,
}: UseMarkReadParams) => {
  const { client } = useChatContext();
  const channel = useChannel();
  const thread = useThreadContext();
  const messagePaginator = useMessagePaginator();

  const isThreadList = !!thread || messageListIsThread;

  const markRead = useCallback(() => {
    if (thread) {
      void thread.markAsRead();
      return;
    }
    void channel.markRead();
  }, [channel, thread]);

  useEffect(() => {
    if (!channel.getConfig()?.read_events) return;
    const shouldMarkRead = () => {
      const wasMarkedUnread =
        !!messagePaginator.unreadStateSnapshot.getLatestValue().firstUnreadMessageId;
      return (
        !document.hidden &&
        !wasMarkedUnread &&
        isMessageListScrolledToBottom &&
        (isThreadList
          ? (thread?.ownUnreadCount ?? 0) > 0
          : !!client.user?.id && !hasReadLastMessage(channel, client.user.id))
      );
    };

    const onVisibilityChange = () => {
      if (shouldMarkRead()) markRead();
    };

    const handleMessageNew = (event: Event) => {
      const threadUpdated = !!thread && event.message?.parent_id === thread.id;
      const mainChannelUpdated =
        !event.message?.parent_id || event.message?.show_in_channel;
      const activeCollectionUpdated = isThreadList ? threadUpdated : mainChannelUpdated;
      if (!activeCollectionUpdated) return;

      if (shouldMarkRead()) {
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
    isThreadList,
    messagePaginator,
    thread,
  ]);
};

// todo: remove?
// function getPreviousLastMessage(messages: LocalMessage[], newMessage?: MessageResponse) {
//   if (!newMessage) return;
//   let previousLastMessage;
//   for (let i = messages.length - 1; i >= 0; i--) {
//     const msg = messages[i];
//     if (!msg?.id) break;
//     if (msg.id !== newMessage.id) {
//       previousLastMessage = msg;
//       break;
//     }
//   }
//   return previousLastMessage;
// }
