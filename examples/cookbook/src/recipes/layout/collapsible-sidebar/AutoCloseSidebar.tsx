import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import type { WorkspaceNavigation } from 'stream-chat-react';
import { useWorkspaceNavigation, WorkspaceNavigationProvider } from 'stream-chat-react';
import { useSidebar } from './SidebarContext';

/**
 * Closes the sidebar when the user picks a channel in it on a phone, where the list covers the
 * channel. Picking the channel that is already open closes it too.
 */
export const AutoCloseSidebar = ({ children }: PropsWithChildren) => {
  const navigation = useWorkspaceNavigation();
  const { closeSidebar } = useSidebar();

  const value = useMemo<WorkspaceNavigation>(
    () => ({
      ...navigation,
      openChannel: (channel, options) => {
        navigation.openChannel(channel, options);
        if (window.matchMedia('(max-width: 767px)').matches) closeSidebar();
      },
    }),
    [navigation, closeSidebar],
  );

  return (
    <WorkspaceNavigationProvider value={value}>{children}</WorkspaceNavigationProvider>
  );
};
