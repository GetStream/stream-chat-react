import { useEffect, useRef, useState } from 'react';
import type { LocalMessage } from 'stream-chat';

type UseMessageSetKeyParams = {
  messages?: LocalMessage[];
};

/** Key for the Virtuoso list, renewed when the list jumps to a new location. */
export const useMessageSetKey = ({ messages }: UseMessageSetKeyParams) => {
  const [messageSetKey, setMessageSetKey] = useState(+new Date());
  const firstMessageId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const continuousSet = messages?.find(
      (message) => message.id === firstMessageId.current,
    );
    if (!continuousSet) {
      setMessageSetKey(+new Date());
    }
    firstMessageId.current = messages?.[0]?.id;
  }, [messages]);

  return {
    messageSetKey,
  };
};
