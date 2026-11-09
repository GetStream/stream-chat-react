import {
  ThreadListHeader,
  useWorkspaceNavigation,
  WorkspaceNavigationBackButton,
} from 'stream-chat-react';

import { SidebarToggle } from './SidebarToggle.tsx';

/** Start content of the headers that carry the sidebar toggle: the primary channel and the threads
 *  view's threads. The SDK's back button stays first. */
export const HeaderStartWithSidebarToggle = () => (
  <>
    <WorkspaceNavigationBackButton />
    <SidebarToggle />
  </>
);

/** The sidebar toggle while a channel is open beside the channel list. With nothing open,
 *  collapsing the sidebar would leave an empty screen. */
export const SidebarToggleWhileChannelOpen = () => {
  const { openChannels } = useWorkspaceNavigation();
  return openChannels.length > 0 ? <SidebarToggle /> : null;
};

/** The sidebar toggle while a thread is open beside the thread list. With nothing open,
 *  collapsing the sidebar would leave an empty screen. */
export const SidebarToggleWhileThreadOpen = () => {
  const { openThreads } = useWorkspaceNavigation();
  return openThreads.length > 0 ? <SidebarToggle /> : null;
};

/** The thread list header, registered as the `ThreadListHeader` override, with the sidebar toggle
 *  at its end. */
export const ThreadListHeaderWithSidebarToggle = () => (
  <ThreadListHeader EndContent={SidebarToggleWhileThreadOpen} />
);
