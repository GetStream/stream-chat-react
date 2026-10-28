import {
  ChannelHeader,
  ChannelNavigation,
  MessageComposer,
  MessageList,
  ThreadHeader,
  ThreadList,
  useThreadContext,
} from 'stream-chat-react';
import {
  ChannelSlot,
  ChatView,
  ChatViewEmptyPlaceholder,
  ThreadSlot,
  useActiveThread,
} from 'stream-chat-react/slot-layout';
import type { ChatViewProps, LayoutDescriptor } from 'stream-chat-react/slot-layout';
import './layout.css';

// The channels view has a slot for the open channel and, after it, one for a
// thread opened from it. The threads view has one slot, for the thread picked
// in the list.
export const layouts: LayoutDescriptor[] = [
  { id: 'channels', slots: ['channel', 'thread'] },
  { id: 'threads', slots: ['thread'] },
];

// In the channels view, every thread opens in the "thread" slot.
export const viewActionSlotResolvers: ChatViewProps['viewActionSlotResolvers'] = {
  channels: { openThread: () => 'thread' },
};

// Marks the thread as on screen while the window is visible and focused.
const ActiveThread = () => {
  const thread = useThreadContext();
  useActiveThread({ activeThread: thread });
  return null;
};

const ThreadPanel = () => (
  <ThreadSlot slot='thread'>
    <ActiveThread />
    <ThreadHeader />
    <MessageList />
    <MessageComposer />
  </ThreadSlot>
);

export const ChannelsView = () => (
  <>
    <ChatView.Selector />
    <ChannelNavigation />
    <ChannelSlot fallback={<ChatViewEmptyPlaceholder />} slot='channel'>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </ChannelSlot>
    <ThreadPanel />
  </>
);

export const ThreadsView = () => (
  <>
    <ChatView.Selector />
    <ThreadList />
    <ThreadPanel />
  </>
);
