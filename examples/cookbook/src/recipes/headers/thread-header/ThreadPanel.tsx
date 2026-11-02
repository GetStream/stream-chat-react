import { MessageComposer, MessageList, useThreadContext } from 'stream-chat-react';
import { ThreadSlot, useActiveThread } from 'stream-chat-react/slot-layout';
import { CustomThreadHeader } from './CustomThreadHeader';

// Marks the thread as on screen, so its new replies are marked read.
const ActiveThread = () => {
  const thread = useThreadContext();
  useActiveThread({ activeThread: thread });
  return null;
};

export const ThreadPanel = () => (
  <ThreadSlot slot='thread'>
    <ActiveThread />
    <CustomThreadHeader />
    <MessageList />
    <MessageComposer />
  </ThreadSlot>
);
