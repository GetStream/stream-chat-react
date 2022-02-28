import { useEffect, useRef, useState } from 'react';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export function useNewMessageNotification<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(messages: StreamMessage<StreamChatGenerics>[], currentUserId?: string) {
  const [newMessagesNotification, setNewMessagesNotification] = useState(false);
  /**
   * use the flag to avoid the initial "new messages" quick blink
   */
  const didMount = useRef(false);

  const lastMessageId = useRef('');
  const atBottom = useRef(false);

  useEffect(() => {
    /* handle scrolling behavior for new messages */
    if (!messages?.length) return;

    const lastMessage = messages[messages.length - 1];
    const prevMessageId = lastMessageId.current;
    lastMessageId.current = lastMessage.id || ''; // update last message id

    /* do nothing if new messages are loaded from top(loadMore)  */
    if (lastMessage.id === prevMessageId) return;

    /* if list is already at the bottom return, followOutput will do the job */
    if (atBottom.current) return;

    /* if the new message belongs to current user scroll to bottom */
    if (lastMessage.user?.id !== currentUserId && didMount.current) {
      /* otherwise just show newMessage notification  */
      setNewMessagesNotification(true);
    }
    didMount.current = true;
  }, [currentUserId, messages]);

  return { atBottom, newMessagesNotification, setNewMessagesNotification };
}
