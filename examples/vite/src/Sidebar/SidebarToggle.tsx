import { useState } from 'react';
import { useSidebar } from '../ChatLayout/SidebarContext.tsx';
import {
  asDynamicKey,
  Button,
  PopperTooltip,
  useTranslationContext,
} from 'stream-chat-react';
import { IconSidebar } from '../icons.tsx';

export const SidebarToggle = () => {
  const { closeSidebar, openSidebar, sidebarOpen } = useSidebar();
  const { t } = useTranslationContext();
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipText = sidebarOpen ? 'Close sidebar' : 'Open sidebar';

  const toggleLabel = sidebarOpen
    ? t(asDynamicKey('viteExample.sidebar.collapse.ariaLabel'), 'Collapse sidebar')
    : t(asDynamicKey('viteExample.sidebar.expand.ariaLabel'), 'Expand sidebar');

  return (
    <>
      <Button
        appearance='ghost'
        aria-label={toggleLabel}
        circular
        className='str-chat__header-sidebar-toggle'
        onBlur={() => setTooltipVisible(false)}
        onClick={sidebarOpen ? closeSidebar : openSidebar}
        onFocus={() => setTooltipVisible(true)}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        ref={setButtonElement}
        size='md'
        variant='secondary'
      >
        <IconSidebar />
      </Button>
      <PopperTooltip
        offset={[0, 8]}
        referenceElement={buttonElement}
        visible={tooltipVisible}
      >
        {tooltipText}
      </PopperTooltip>
    </>
  );
};
