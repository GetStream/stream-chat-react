import {
  ChannelHeader,
  ChannelLists,
  MessageComposer,
  MessageList,
  Search,
  ThreadHeader,
} from 'stream-chat-react';
import { ChannelSlot, ThreadSlot } from 'stream-chat-react/slot-layout';
import type { LayoutDescriptor } from 'stream-chat-react/slot-layout';
import './Workspace.css';

export const layouts: LayoutDescriptor[] = [
  { id: 'channels', slots: ['channel', 'thread'] },
];

export const ChannelsView = () => (
  <div className='cookbook-workspace'>
    <header className='cookbook-workspace__top-bar'>
      <Search placeholder='Search everything' />
    </header>
    <div className='cookbook-workspace__body'>
      <aside className='cookbook-workspace__sidebar'>
        <ChannelLists />
      </aside>
      <ChannelSlot slot='channel'>
        <ChannelHeader />
        <MessageList />
        <MessageComposer />
      </ChannelSlot>
      <ThreadSlot slot='thread'>
        <ThreadHeader />
        <MessageList />
        <MessageComposer />
      </ThreadSlot>
    </div>
  </div>
);
