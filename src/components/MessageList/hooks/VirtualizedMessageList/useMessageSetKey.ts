import { useEffect, useRef, useState } from 'react';
import type { LocalMessage } from 'stream-chat';

type UseMessageSetKeyParams = {
  messages?: LocalMessage[];
};

/**
 * Key for the Virtuoso list, renewed when the list jumps to a new location: the shown messages no
 * longer include the previous first message (an empty list counts as having none). Appending or
 * prepending keeps the key, and so does the set the list mounted with: remounting it would only
 * repeat Virtuoso's initial positioning, during which react-virtuoso 4 hides the list.
 */
export const useMessageSetKey = ({ messages }: UseMessageSetKeyParams) => {
  // A counter, not a timestamp: two renewals within one millisecond still change the key.
  const [messageSetKey, setMessageSetKey] = useState(0);
  const firstMessageId = useRef<string | undefined>(undefined);
  const hasRun = useRef(false);

  useEffect(() => {
    const previousFirstMessageId = firstMessageId.current;
    firstMessageId.current = messages?.[0]?.id;
    if (!hasRun.current) {
      hasRun.current = true;
      return;
    }
    const continuousSet = messages?.some(
      (message) => message.id === previousFirstMessageId,
    );
    if (!continuousSet) {
      setMessageSetKey((key) => key + 1);
    }
  }, [messages]);

  return {
    messageSetKey,
  };
};
