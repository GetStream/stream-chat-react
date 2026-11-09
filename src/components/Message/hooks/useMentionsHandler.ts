import type React from 'react';
import type { LocalMessage } from 'stream-chat';

import { messageHasMentions } from '../renderText/rehypePlugins';
import { useStableCallback } from '../../../utils';
import type { ReactEventHandler } from '../types';

export type CustomMentionHandler = (
  event: React.BaseSyntheticEvent,
  message: LocalMessage,
) => void;

/** Calls `handler` with the message, only for a message that mentions anyone. */
const callForMentions = (
  handler: CustomMentionHandler | undefined,
  event: React.BaseSyntheticEvent,
  message?: LocalMessage,
) => {
  if (!handler || !message || !messageHasMentions(message)) return;
  handler(event, message);
};

/**
 * Returns the event handlers for a message's mentions, each `undefined` when its custom handler is
 * not set. A returned handler keeps its identity across renders and always calls the latest custom
 * handler and message, so a memoized message that keeps an earlier one still runs the current.
 */
export const useMentionsHandler = (
  message?: LocalMessage,
  customMentionHandler?: {
    onMentionsClick?: CustomMentionHandler;
    onMentionsHover?: CustomMentionHandler;
  },
): {
  onMentionsClick?: ReactEventHandler;
  onMentionsHover?: ReactEventHandler;
} => {
  const onMentionsClick = useStableCallback((event: React.BaseSyntheticEvent) =>
    callForMentions(customMentionHandler?.onMentionsClick, event, message),
  );
  const onMentionsHover = useStableCallback((event: React.BaseSyntheticEvent) =>
    callForMentions(customMentionHandler?.onMentionsHover, event, message),
  );

  return {
    onMentionsClick: customMentionHandler?.onMentionsClick ? onMentionsClick : undefined,
    onMentionsHover: customMentionHandler?.onMentionsHover ? onMentionsHover : undefined,
  };
};
