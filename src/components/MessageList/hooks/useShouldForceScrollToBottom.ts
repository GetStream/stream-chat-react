import { useEffect, useRef } from 'react';
import type { VirtualizedMessageListInternalProps } from 'types';

export function useShouldForceScrollToBottom(
  messages: VirtualizedMessageListInternalProps['messages'],
  currentUserId?: string,
) {
  const lastFocusedOwnMessage = useRef('');
  const initialFocusRegistered = useRef(false);

  function recheckForNewOwnMessage() {
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      if (
        lastMessage.user?.id === currentUserId &&
        lastFocusedOwnMessage.current !== lastMessage.id
      ) {
        lastFocusedOwnMessage.current = lastMessage.id;
        return true;
      }
    }
    return false;
  }

  useEffect(() => {
    if (messages && messages.length && !initialFocusRegistered.current) {
      initialFocusRegistered.current = true;
      recheckForNewOwnMessage();
    }
  }, [messages, messages?.length]);

  return recheckForNewOwnMessage;
}
