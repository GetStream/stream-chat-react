import { useSidebar } from '../ChatLayout/SidebarContext.tsx';
import { Button, useTranslationContext } from 'stream-chat-react';
import { IconSidebar } from '../icons.tsx';

export const SidebarToggle = () => {
  const { closeSidebar, openSidebar, sidebarOpen } = useSidebar();
  const { t } = useTranslationContext();
  return (
    <Button
      appearance='ghost'
      aria-label={sidebarOpen ? t('aria/Collapse sidebar') : t('aria/Expand sidebar')}
      circular
      className='str-chat__header-sidebar-toggle'
      onClick={sidebarOpen ? closeSidebar : openSidebar}
      size='md'
      variant='secondary'
    >
      <IconSidebar />
    </Button>
  );
};
