import { useEffect, useRef } from 'react';
import {
  StreamMessage,
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
} from '../../../context';
import { Event, MessageResponse } from 'stream-chat';
import { DefaultStreamChatGenerics } from '../../../types';

type UseMarkReadParams = {
  isMessageListScrolledToBottom: boolean;
  messageListIsThread: boolean;
  unreadCount: number;
  wasMarkedUnread?: boolean;
};

/**
 * Takes care of marking a channel read. The channel is read only if all the following applies:
 * 1. the message list is not rendered in a thread
 * 2. the message list is scrolled to the bottom
 * 3. the channel was not marked unread by the user
 * @param isMessageListScrolledToBottom
 * @param messageListIsThread
 * @param unreadCount
 * @param wasChannelMarkedUnread
 */
export const useMarkRead = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  isMessageListScrolledToBottom,
  messageListIsThread,
  unreadCount,
  wasMarkedUnread,
}: UseMarkReadParams) => {
  const { client } = useChatContext<StreamChatGenerics>('useMarkRead');
  const { markRead, setChannelUnreadUiState } = useChannelActionContext('useMarkRead');
  const { channel } = useChannelStateContext('useMarkRead');
  const previousRenderMessageListScrolledToBottom = useRef(isMessageListScrolledToBottom);

  useEffect(() => {
    const shouldMarkRead = (unreadMessages: number) =>
      !document.hidden &&
      !wasMarkedUnread &&
      !messageListIsThread &&
      isMessageListScrolledToBottom &&
      unreadMessages > 0;

    const onVisibilityChange = () => {
      if (shouldMarkRead(unreadCount)) markRead();
    };

    const handleMessageNew = (event: Event<StreamChatGenerics>) => {
      const newMessageToCurrentChannel = event.cid === channel.cid;
      const isOwnMessage = event.user?.id && event.user.id === client.user?.id;
      const mainChannelUpdated = !event.message?.parent_id || event.message?.show_in_channel;
      if (isOwnMessage) return;
      if (!isMessageListScrolledToBottom || wasMarkedUnread || document.hidden) {
        setChannelUnreadUiState((prev) => {
          const previousUnreadCount = prev?.unread_messages ?? 0;
          const previousLastMessage = getPreviousLastMessage<StreamChatGenerics>(
            channel.state.messages,
            event.message,
          );
          return {
            ...(prev || {}),
            last_read:
              prev?.last_read ??
              (previousUnreadCount === 0 && previousLastMessage?.created_at
                ? new Date(previousLastMessage.created_at)
                : new Date(0)), // not having information about the last read message means the whole channel is unread,
            unread_messages: previousUnreadCount + 1,
          };
        });
      } else if (
        newMessageToCurrentChannel &&
        mainChannelUpdated &&
        !isOwnMessage &&
        shouldMarkRead(channel.countUnread())
      ) {
        markRead();
      }
    };

    client.on('message.new', handleMessageNew);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const hasScrolledToBottom =
      previousRenderMessageListScrolledToBottom.current !== isMessageListScrolledToBottom &&
      isMessageListScrolledToBottom;
    if (shouldMarkRead(hasScrolledToBottom ? channel.countUnread() : unreadCount)) markRead();
    previousRenderMessageListScrolledToBottom.current = isMessageListScrolledToBottom;

    return () => {
      client.off('message.new', handleMessageNew);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    channel,
    client,
    isMessageListScrolledToBottom,
    markRead,
    messageListIsThread,
    setChannelUnreadUiState,
    unreadCount,
    wasMarkedUnread,
  ]);
};

function getPreviousLastMessage<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(messages: StreamMessage<StreamChatGenerics>[], newMessage?: MessageResponse<StreamChatGenerics>) {
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
