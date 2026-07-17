import { useCallback, useEffect, useRef } from 'react';
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

  const wasAtBottomRef = useRef(isMessageListScrolledToBottom);
  const hasLeftBottomRef = useRef(false);

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

    const wasAtBottom = wasAtBottomRef.current;
    wasAtBottomRef.current = isMessageListScrolledToBottom;
    if (wasAtBottom && !isMessageListScrolledToBottom) {
      hasLeftBottomRef.current = true;
    }
    const scrolledBackToBottom =
      !wasAtBottom && isMessageListScrolledToBottom && hasLeftBottomRef.current;

    const onVisibilityChange = () => {
      if (shouldMarkRead()) {
        resetUnreadSnapshot();
        markRead();
      }
    };

    const handleMessageNew = (event: Event) => {
      const threadUpdated = !!thread && event.message?.parent_id === thread.id;
      const mainChannelUpdated =
        !event.message?.parent_id || event.message?.show_in_channel;
      const activeCollectionUpdated = isThreadList ? threadUpdated : mainChannelUpdated;
      if (!activeCollectionUpdated) return;

      // MERGE-RECONCILE: this is the fix/prevent-unread-indicator-threads scenario
      // (this branch's origin). Master's manual setChannelUnreadUiState mechanism was
      // removed by PR #2909; unread state is now driven by messagePaginator.
      // unreadStateSnapshot, and the thread-vs-channel guard above. Verify at runtime
      // that thread replies do NOT bump the channel's unread UI under the paginator model.
      if (shouldMarkRead()) {
        resetUnreadSnapshot();
        markRead();
      }
    };

    channel.on('message.new', handleMessageNew);
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (shouldMarkRead()) {
      // On open (no scroll-back) mark read on the SERVER only and keep the snapshot so the
      // separator/banner persist; on a real scroll-back-to-bottom also clear the snapshot.
      if (scrolledBackToBottom) {
        resetUnreadSnapshot();
        hasLeftBottomRef.current = false;
      }
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
    resetUnreadSnapshot,
    isThreadList,
    messagePaginator,
    thread,
  ]);
};
