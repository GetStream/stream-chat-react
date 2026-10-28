import type { Thread as StreamThread } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelNavigation,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
  ThreadList,
} from 'stream-chat-react';
import { ChatView, Slot, useActiveThread } from 'stream-chat-react/slot-layout';
import type {
  ChatViewSlotRenderers,
  DeriveWorkspaceNavigation,
  LayoutDescriptor,
} from 'stream-chat-react/slot-layout';
import './layout.css';

export const layouts: LayoutDescriptor[] = [
  { id: 'channels', slots: ['channel', 'thread'] },
  { id: 'threads', slots: ['thread'] },
];

// ⌘/ctrl-click on a channel opens it beside the open one. Declared outside the
// component, so ChatView gets the same function on every render.
export const deriveWorkspaceNavigation: DeriveWorkspaceNavigation = (base) => ({
  openChannel: (channel, options) =>
    base.openChannel(channel, {
      ...options,
      additive:
        options?.additive ?? !!(options?.event?.metaKey || options?.event?.ctrlKey),
    }),
});

const ThreadContent = ({ thread }: { thread: StreamThread }) => {
  // Marks the thread as on screen while the window is visible and focused.
  useActiveThread({ activeThread: thread });
  return (
    <Thread thread={thread}>
      <ThreadHeader />
      <MessageList />
      <MessageComposer />
    </Thread>
  );
};

// How a slot shows a channel and a thread. Each renderer returns an element;
// hooks go in the component it renders.
export const slotRenderers: ChatViewSlotRenderers = {
  channel: ({ source }) => (
    <Channel channel={source}>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </Channel>
  ),
  thread: ({ source }) => <ThreadContent thread={source} />,
};

export const ChannelsView = () => (
  <>
    <ChatView.Selector />
    <ChannelNavigation />
    <Slot slot='channel' />
    <Slot slot='thread' />
  </>
);

export const ThreadsView = () => (
  <>
    <ChatView.Selector />
    <ThreadList />
    <Slot slot='thread' />
  </>
);
