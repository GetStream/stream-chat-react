import { useCallback, useEffect } from 'react';
import { useChannel, useChatContext } from '../../../context';
import { useMessagePaginator } from '../../../hooks';
import { useThreadContext } from '../../Threads';
import type { Channel, EventPayload } from 'stream-chat';
import { getChannelConfig } from '../../../utils/getChannelConfig';

const hasReadLastMessage = (channel: Channel, userId: string) => {
  const latestMessageIdInChannel = channel.messagePaginator.headmostItem?.id;
  const lastReadMessageIdServer = channel.state.read[userId]?.last_read_message_id;
  return latestMessageIdInChannel === lastReadMessageIdServer;
};

type UseMarkReadParams = {
  hasMoreNewer: boolean;
  isMessageListScrolledToBottom: boolean;
  // todo: remove and infer only from useThreadContext return value - if undefined, not a thread list
  messageListIsThread: boolean;
};

/**
 * Marks the active message collection (channel or thread) read when the user is caught up at the
 * bottom, and keeps the paginator's unread snapshot (the "Unread messages" separator / "N new"
 * banner) in sync.
 */
export const useMarkRead = ({
  hasMoreNewer,
  isMessageListScrolledToBottom,
  messageListIsThread,
}: UseMarkReadParams) => {
  const { client } = useChatContext();
  const channel = useChannel();
  const thread = useThreadContext();
  const messagePaginator = useMessagePaginator();

  const isThreadList = !!thread || messageListIsThread;

  const markRead = useCallback(() => {
    client.messageDeliveryReporter.throttledMarkRead(thread ?? channel);
  }, [channel, client.messageDeliveryReporter, thread]);

  // Advance the frozen unread snapshot the separator/banner render from. The LLC never clears it on
  // `message.read`, so on a genuine catch-up we clear it ourselves; deliberately NOT called on the
  // initial open (see the effect below) so the separator persists where the user left off.
  const resetUnreadSnapshot = useCallback(() => {
    const loadedItems = messagePaginator.state.getLatestValue().items ?? [];
    const previous = messagePaginator.unreadStateSnapshot.getLatestValue();
    messagePaginator.unreadStateSnapshot.next({
      ...previous,
      firstUnreadMessageId: null,
      lastReadAt: new Date(),
      lastReadMessageId:
        loadedItems[loadedItems.length - 1]?.id ?? previous.lastReadMessageId,
      unreadCount: 0,
    });
  }, [messagePaginator]);

  useEffect(() => {
    // Tell the state layer whether the user is actively viewing the latest messages (tab
    // foregrounded AND at the bottom AND no newer messages beyond the loaded window). While live,
    // the LLC skips the own-unread bump on `message.new` so the separator/banner never flash.
    const pushViewingLive = () =>
      messagePaginator.setViewingLive(
        !document.hidden && isMessageListScrolledToBottom && !hasMoreNewer,
      );

    pushViewingLive();
    document.addEventListener('visibilitychange', pushViewingLive);

    return () => {
      document.removeEventListener('visibilitychange', pushViewingLive);
      messagePaginator.setViewingLive(false);
    };
  }, [hasMoreNewer, isMessageListScrolledToBottom, messagePaginator]);

  useEffect(() => {
    // `getChannelConfig` (rather than `channel.getConfig()`) so a disconnected channel
    // yields `undefined` instead of throwing.
    const unreadNotificationSupported =
      getChannelConfig(channel)?.read_events || client.options.isLocalUnreadCountEnabled;

    if (!unreadNotificationSupported) return;

    const shouldMarkRead = () => {
      const wasMarkedUnread =
        !!messagePaginator.unreadStateSnapshot.getLatestValue().firstUnreadMessageId;

      const hasUnreadMessages = isThreadList
        ? (thread?.ownUnreadCount ?? 0) > 0
        : !!client.user?.id && !hasReadLastMessage(channel, client.user.id);

      return messagePaginator.isViewingLive && !wasMarkedUnread && hasUnreadMessages;
    };

    const onVisibilityChange = () => {
      if (shouldMarkRead()) {
        resetUnreadSnapshot();
        markRead();
      }
    };

    const handleMessageNew = (event: EventPayload<'message.new'>) => {
      const threadUpdated = !!thread && event.message?.parent_id === thread.id;
      const mainChannelUpdated =
        !event.message?.parent_id || event.message?.show_in_channel;
      const activeCollectionUpdated = isThreadList ? threadUpdated : mainChannelUpdated;
      if (!activeCollectionUpdated) return;

      if (shouldMarkRead()) {
        resetUnreadSnapshot();
        markRead();
      }
    };

    const subscription = channel.on('message.new', handleMessageNew);
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (shouldMarkRead()) {
      markRead();
    }

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    channel,
    client,
    hasMoreNewer,
    isMessageListScrolledToBottom,
    markRead,
    resetUnreadSnapshot,
    isThreadList,
    messagePaginator,
    thread,
  ]);
};
