import React, { useCallback, useEffect } from 'react';
import type { StreamMessage } from '../../../../context';
import { DefaultStreamChatGenerics } from '../../../../types/types';

type UseScrollToBottomOnNewMessageParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** */
  scrollToBottom: () => void;
  messages?: StreamMessage<StreamChatGenerics>[];
  /** When `true`, the list will scroll to the latest message when the window regains focus */
  scrollToLatestMessageOnFocus?: boolean;
};

export const useScrollToBottomOnNewMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  messages,
  scrollToBottom,
  scrollToLatestMessageOnFocus,
}: UseScrollToBottomOnNewMessageParams<StreamChatGenerics>) => {
  const [newMessagesReceivedInBackground, setNewMessagesReceivedInBackground] = React.useState(
    false,
  );

  const resetNewMessagesReceivedInBackground = useCallback(() => {
    setNewMessagesReceivedInBackground(false);
  }, []);

  useEffect(() => {
    setNewMessagesReceivedInBackground(true);
  }, [messages]);

  const scrollToBottomIfConfigured = useCallback(
    (event: Event) => {
      if (
        !scrollToLatestMessageOnFocus ||
        !newMessagesReceivedInBackground ||
        event.target !== window
      )
        return;
      setTimeout(scrollToBottom, 100);
    },
    [scrollToLatestMessageOnFocus, scrollToBottom, newMessagesReceivedInBackground],
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', scrollToBottomIfConfigured);
      window.addEventListener('blur', resetNewMessagesReceivedInBackground);
    }

    return () => {
      window.removeEventListener('focus', scrollToBottomIfConfigured);
      window.removeEventListener('blur', resetNewMessagesReceivedInBackground);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottomIfConfigured]);
};
