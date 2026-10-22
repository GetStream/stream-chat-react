import { useEffect, useRef, useState } from 'react';
import type { LocalMessage, MessagePaginatorState } from 'stream-chat';
import type { RenderedMessage } from '../../utils';
import { useMessagePaginator } from '../../../../hooks';
import { useStateStore } from '../../../../store';

const messagePaginatorStateSelector = (state: MessagePaginatorState) => ({
  hasMoreNewer: state.hasMoreHead,
});

/**
 * Whether a change of the last rendered message means a message arrived at the latest end of the
 * list, as opposed to the loaded window moving.
 *
 * - A window that is not at the latest messages (`hasMoreNewer`) changes its last message only by
 *   loading pages or jumping, never by a message arriving.
 * - A window that no longer contains the previous last message was replaced (a jump, e.g. back to
 *   the latest messages) rather than extended at its end. The first rendered window has no
 *   previous last message, so it never counts as an arrival either.
 */
const isArrivalAtLatestMessages = ({
  hasMoreNewer,
  messages,
  prevMessageId,
}: {
  hasMoreNewer: boolean;
  messages: RenderedMessage[];
  prevMessageId: string;
}) => !hasMoreNewer && messages.some((message) => message.id === prevMessageId);

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
  const lastMessageId = useRef('');
  const atBottom = useRef(false);

  useEffect(() => {
    if (!messages?.length) return;

    const lastMessage = messages[messages.length - 1];
    const prevMessageId = lastMessageId.current;
    lastMessageId.current = lastMessage.id || '';

    // Unchanged last message: older messages were loaded at the top.
    if (lastMessage.id === prevMessageId) return;

    if (!isArrivalAtLatestMessages({ hasMoreNewer, messages, prevMessageId })) return;

    // At the bottom, `followOutput` scrolls the list.
    if (atBottom.current) return;

    // Only messages from other users notify.
    if ((lastMessage as LocalMessage).user?.id !== currentUserId) {
      setNewMessagesNotification(true);
    }
  }, [currentUserId, messages, hasMoreNewer]);

  return {
    atBottom,
    isMessageListScrolledToBottom,
    newMessagesNotification,
    setIsMessageListScrolledToBottom,
    setNewMessagesNotification,
  };
}
