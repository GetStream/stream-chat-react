import type { PropsWithChildren } from 'react';
import {
  ChannelHeader,
  ChannelListHeader,
  ChannelNavigation,
  MessageComposer,
  MessageList,
  ThreadHeader,
  useWorkspaceNavigation,
  WorkspaceNavigationBackButton,
} from 'stream-chat-react';
import { ChannelSlot, ThreadSlot } from 'stream-chat-react/slot-layout';
import type { LayoutDescriptor } from 'stream-chat-react/slot-layout';
import { AutoCloseSidebar } from './AutoCloseSidebar';
import { useSidebar } from './SidebarContext';
import { SidebarToggle } from './SidebarToggle';
import './sidebar.css';

export const layouts: LayoutDescriptor[] = [
  { id: 'channels', slots: ['channel', 'thread'] },
];

// The toggle, only while a channel or thread is open beside the list. With nothing open,
// collapsing the sidebar would leave an empty screen. `openChannels` / `openThreads` hold the
// channels and threads the panels were opened with, so checking both covers a thread stacked over
// a channel.
const SidebarToggleWhileContentOpen = () => {
  const { openChannels, openThreads } = useWorkspaceNavigation();
  return openChannels.length > 0 || openThreads.length > 0 ? <SidebarToggle /> : null;
};

// The default channel list header, with the toggle at its end.
const ChannelListHeaderWithToggle = () => (
  <ChannelListHeader EndContent={SidebarToggleWhileContentOpen} />
);

// Declared once, so WithComponents gets the same object on every render.
export const overrides = { ChannelListHeader: ChannelListHeaderWithToggle };

// The toggle, then the back button the header shows by default.
const ChannelHeaderStart = () => (
  <>
    <SidebarToggle />
    <WorkspaceNavigationBackButton />
  </>
);

export const ChannelsView = () => (
  <>
    <AutoCloseSidebar>
      <ChannelNavigation />
    </AutoCloseSidebar>
    <ChannelSlot slot='channel'>
      <ChannelHeader StartContent={ChannelHeaderStart} />
      <MessageList />
      <MessageComposer />
    </ChannelSlot>
    <ThreadSlot slot='thread'>
      <ThreadHeader />
      <MessageList />
      <MessageComposer />
    </ThreadSlot>
  </>
);

// Around ChatView: its class says whether the channel list is collapsed.
export const SidebarLayout = ({ children }: PropsWithChildren) => {
  const { sidebarOpen } = useSidebar();

  return (
    <div
      className={`cookbook-sidebar-layout ${sidebarOpen ? '' : 'cookbook-sidebar-layout--collapsed'}`}
    >
      {children}
    </div>
  );
};
