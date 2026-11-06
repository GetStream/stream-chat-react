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
 *  collapsing the sidebar would leave an empty screen. `openChannels` / `openThreads` hold what is
 *  bound to the panels; a channel or thread stacked over one is not in them, but always sits over
 *  something that is, so checking both lists covers it. */
export const SidebarToggleWhileContentOpen = () => {
  const { openChannels, openThreads } = useWorkspaceNavigation();
  return openChannels.length > 0 || openThreads.length > 0 ? <SidebarToggle /> : null;
};

/** The thread list header, registered as the `ThreadListHeader` override, with the sidebar toggle
 *  at its end. */
export const ThreadListHeaderWithSidebarToggle = () => (
  <ThreadListHeader EndContent={SidebarToggleWhileContentOpen} />
);
