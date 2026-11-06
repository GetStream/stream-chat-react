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

/** The sidebar toggle while a channel or thread is open beside the list. With nothing open,
 *  collapsing the sidebar would leave an empty screen. `openChannels` / `openThreads` hold the
 *  channels and threads the panels were opened with, so checking both covers a thread stacked over
 *  a channel. A panel opened with a user profile is in neither list, and the toggle stays hidden
 *  next to it. */
export const SidebarToggleWhileContentOpen = () => {
  const { openChannels, openThreads } = useWorkspaceNavigation();
  return openChannels.length > 0 || openThreads.length > 0 ? <SidebarToggle /> : null;
};

/** The thread list header, registered as the `ThreadListHeader` override, with the sidebar toggle
 *  at its end. */
export const ThreadListHeaderWithSidebarToggle = () => (
  <ThreadListHeader EndContent={SidebarToggleWhileContentOpen} />
);
