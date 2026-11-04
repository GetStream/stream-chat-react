import { useMemo } from 'react';
import { MessageBubbleContent } from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings';
import { buildBubbleContentSet } from './bubbleContent';

/** The message bubble's content, in the order set in Settings -> Message. */
export const ConfigurableMessageBubbleContent = () => {
  const { contentOrder } = useAppSettingsSelector((state) => state.messageBubble);
  const contentSet = useMemo(() => buildBubbleContentSet(contentOrder), [contentOrder]);

  return <MessageBubbleContent messageBubbleContentSet={contentSet} />;
};
