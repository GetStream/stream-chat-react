import {
  MessageList,
  type MessageListProps,
  VirtualizedMessageList,
} from 'stream-chat-react';

import { useVirtualizedMessageList } from '../hooks';

// The replies list of a thread panel. `<Thread>` composes nothing itself, so each panel says what
// it wants -- this is the part every panel says identically: honor the app's list-type setting, and
// leave out date separators (the parent message already carries one). Props reach the standard list
// only; the virtualized one drills a narrower set, so anything passed here follows the standard
// list's default when the virtualized list is on.
export const ThreadMessageList = (props: MessageListProps) => {
  const virtualized = useVirtualizedMessageList();
  return virtualized ? (
    <VirtualizedMessageList withDateSeparator={false} />
  ) : (
    <MessageList withDateSeparator={false} {...props} />
  );
};
