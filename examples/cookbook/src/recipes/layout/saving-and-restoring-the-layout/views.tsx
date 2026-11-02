import { useEffect } from 'react';
import {
  ChannelHeader,
  ChannelNavigation,
  MessageComposer,
  MessageList,
  ThreadHeader,
  ThreadList,
  useChannel,
} from 'stream-chat-react';
import { ChannelSlot, ChatView, ThreadSlot } from 'stream-chat-react/slot-layout';
import type { LayoutDescriptor } from 'stream-chat-react/slot-layout';

export const layouts: LayoutDescriptor[] = [
  { id: 'channels', slots: ['channel', 'thread'] },
  { id: 'threads', slots: ['thread'] },
];

// Watches the channel its slot shows. A channel from the list is watched
// already, and then this sends nothing.
const WatchChannel = () => {
  const channel = useChannel();

  useEffect(() => {
    channel.watch().catch((error) => console.error('Could not watch the channel', error));
  }, [channel]);

  return null;
};

const ThreadPanel = () => (
  <ThreadSlot slot='thread'>
    <ThreadHeader />
    <MessageList />
    <MessageComposer />
  </ThreadSlot>
);

export const ChannelsView = () => (
  <>
    <ChatView.Selector />
    <ChannelNavigation />
    <ChannelSlot slot='channel'>
      <WatchChannel />
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
