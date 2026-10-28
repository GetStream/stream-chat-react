import {
  MessageComposer,
  MessageList,
  ThreadHeader,
  ThreadList,
  useThreadContext,
  WithComponents,
} from 'stream-chat-react';
import {
  ChatViewEmptyPlaceholder,
  ThreadSlot,
  useActiveThread,
} from 'stream-chat-react/slot-layout';
import { ThreadRow } from './ThreadRow';
import './ThreadsView.css';

// Declared once, so WithComponents gets the same object on every render.
const overrides = { ThreadListItemUI: ThreadRow };

// Marks the open thread as on screen, so its new replies are marked read.
const ActiveThread = () => {
  const thread = useThreadContext();
  useActiveThread({ activeThread: thread });
  return null;
};

/** The user's threads in place of the channel list, and the one picked beside them. */
export const ThreadsView = () => (
  <>
    <WithComponents overrides={overrides}>
      <ThreadList />
    </WithComponents>
    <ThreadSlot fallback={<ChatViewEmptyPlaceholder />} slot='thread'>
      <ActiveThread />
      <ThreadHeader />
      <MessageList />
      <MessageComposer />
    </ThreadSlot>
  </>
);
