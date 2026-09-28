import { WorkspaceNavigationBackButton } from 'stream-chat-react';

import { SidebarToggle } from './SidebarToggle.tsx';

/** Start content of the headers that carry the sidebar toggle: the primary channel and the threads
 *  view's threads. The SDK's back button stays first. */
export const HeaderStartWithSidebarToggle = () => (
  <>
    <WorkspaceNavigationBackButton />
    <SidebarToggle />
  </>
);
