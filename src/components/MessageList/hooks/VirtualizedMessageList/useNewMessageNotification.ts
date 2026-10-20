import { useEffect, useRef, useState } from 'react';
import type { LocalMessage, MessagePaginatorState } from 'stream-chat';
import type { RenderedMessage } from '../../utils';
import { useMessagePaginator } from '../../../../hooks';
import { useStateStore } from '../../../../store';

const messagePaginatorStateSelector = (state: MessagePaginatorState) => ({
  hasMoreNewer: state.hasMoreHead,
});

export function useNewMessageNotification(
  messages: RenderedMessage[],
  currentUserId: string | undefined,
  // hasMoreNewer?: boolean,
) {
  const [newMessagesNotification, setNewMessagesNotification] = useState(false);
  const [isMessageListScrolledToBottom, setIsMessageListScrolledToBottom] =
    useState(true);
  const messagePaginator = useMessagePaginator();
  const { hasMoreNewer } = useStateStore(
    messagePaginator.state,
    messagePaginatorStateSelector,
  );
  // Avoids a brief "new messages" flash for the initial messages.
  const didMount = useRef(false);

  const lastMessageId = useRef('');
  const atBottom = useRef(false);

  useEffect(() => {
    if (hasMoreNewer) {
      setNewMessagesNotification(true);
      return;
    }
    if (!messages?.length) return;

    const lastMessage = messages[messages.length - 1];
    const prevMessageId = lastMessageId.current;
    lastMessageId.current = lastMessage.id || '';

    // Unchanged last message: older messages were loaded at the top.
    if (lastMessage.id === prevMessageId) return;

    // At the bottom, `followOutput` scrolls the list.
    if (atBottom.current) return;

    // Only messages from other users notify.
    if ((lastMessage as LocalMessage).user?.id !== currentUserId && didMount.current) {
      setNewMessagesNotification(true);
    }
    didMount.current = true;
  }, [currentUserId, messages, hasMoreNewer]);

  return {
    atBottom,
    isMessageListScrolledToBottom,
    newMessagesNotification,
    setIsMessageListScrolledToBottom,
    setNewMessagesNotification,
  };
}
