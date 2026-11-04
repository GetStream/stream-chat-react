import { Button, IconMenu } from 'stream-chat-react';
import { useSidebar } from './SidebarContext';

export const SidebarToggle = () => {
  const { closeSidebar, openSidebar, sidebarOpen } = useSidebar();

  return (
    <Button
      appearance='ghost'
      aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      circular
      className='cookbook-sidebar-toggle'
      onClick={sidebarOpen ? closeSidebar : openSidebar}
      size='md'
      variant='secondary'
    >
      <IconMenu />
    </Button>
  );
};
