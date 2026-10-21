import { useCallback, useEffect } from 'react';
import { useChannel, useChatContext } from '../../../context';
import { useMessagePaginator } from '../../../hooks';
import { useStateStore } from '../../../store';
import { useThreadContext } from '../../Threads';
import type { Channel, ChannelConfig, EventPayload } from 'stream-chat';
import { nowNs } from 'stream-chat';

const readEventsSelector = ({ readEvents }: ChannelConfig) => ({
  localUnreadCountEnabled: readEvents.localUnreadCountEnabled,
  readEventsEnabled: readEvents.enabled,
});

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
  /**
   * Whether the last message is fully shown. Pass it when the at-bottom flag is thresholded and can
   * read true while the last message is partly clipped. Defaults to true, so only the flag applies.
   */
  isAtTrueBottom?: boolean;
};

/**
 * Marks the channel or thread read when the user is caught up at the bottom, clears the
 * paginator's unread snapshot on that catch-up, and tells the paginator whether the user is
 * viewing live.
 */
export const useMarkRead = ({
  hasMoreNewer,
  isAtTrueBottom = true,
  isMessageListScrolledToBottom,
  messageListIsThread,
}: UseMarkReadParams) => {
  const { client } = useChatContext();
  const channel = useChannel();
  const { localUnreadCountEnabled, readEventsEnabled } = useStateStore(
    channel.configState,
    readEventsSelector,
  );
  const thread = useThreadContext();
  const messagePaginator = useMessagePaginator();

  const isThreadList = !!thread || messageListIsThread;

  const markRead = useCallback(() => {
    client.messageDeliveryReporter.throttledMarkRead(thread ?? channel);
  }, [channel, client.messageDeliveryReporter, thread]);

  // Clears the unread snapshot the separator and banner render from, which the LLC never clears on
  // `message.read`. Not called on the initial open, so the separator stays where the user left off.
  const resetUnreadSnapshot = useCallback(() => {
    const loadedItems = messagePaginator.state.getLatestValue().items ?? [];
    const previous = messagePaginator.unreadStateSnapshot.getLatestValue();
    messagePaginator.unreadStateSnapshot.next({
      ...previous,
      firstUnreadMessageId: null,
      lastReadAt: nowNs(),
      lastReadMessageId:
        loadedItems[loadedItems.length - 1]?.id ?? previous.lastReadMessageId,
      unreadCount: 0,
    });
  }, [messagePaginator]);

  useEffect(() => {
    // Live means the tab is visible, the list is at the bottom and no newer messages lie beyond the
    // loaded window. While live, the LLC skips the own-unread bump on `message.new`, so the
    // separator and banner do not flash.
    const pushViewingLive = () =>
      messagePaginator.setViewingLive(
        !document.hidden &&
          isMessageListScrolledToBottom &&
          isAtTrueBottom &&
          !hasMoreNewer,
      );

    pushViewingLive();
    document.addEventListener('visibilitychange', pushViewingLive);

    return () => {
      document.removeEventListener('visibilitychange', pushViewingLive);
      messagePaginator.setViewingLive(false);
    };
  }, [hasMoreNewer, isAtTrueBottom, isMessageListScrolledToBottom, messagePaginator]);

  useEffect(() => {
    // Without read events there is no server-side read state, but a channel counting unread locally
    // still needs the catch-up; the LLC resets it locally instead of requesting.
    if (!readEventsEnabled && !localUnreadCountEnabled) return;
    const shouldMarkRead = () => {
      const wasMarkedUnread =
        !!messagePaginator.unreadStateSnapshot.getLatestValue().firstUnreadMessageId;

      const hasUnreadMessages = isThreadList
        ? (thread?.ownUnreadCount ?? 0) > 0
        : !!client.user?.id && !hasReadLastMessage(channel, client.user.id);

      return (
        isAtTrueBottom &&
        messagePaginator.isViewingLive &&
        !wasMarkedUnread &&
        hasUnreadMessages
      );
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
    isAtTrueBottom,
    isMessageListScrolledToBottom,
    markRead,
    resetUnreadSnapshot,
    isThreadList,
    localUnreadCountEnabled,
    messagePaginator,
    readEventsEnabled,
    thread,
  ]);
};
