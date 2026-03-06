import { useIsMobileViewport } from '../ChannelHeader/hooks/useIsMobileViewport';
import { useChatContext, useTranslationContext } from '../../context';
import { Button, type ButtonProps } from './Button';

type ToggleSidebarButtonProps = ButtonProps & {
  /** expand mode is usually assigned to button, whose task is to show the sidebar, and collapse vice versa */
  mode: 'expand' | 'collapse';
  /** usually can collapse if an item from sidebar was selected */
  canCollapse?: boolean;
};

export const ToggleSidebarButton = ({
  canCollapse,
  mode,
  ...props
}: ToggleSidebarButtonProps) => {
  const { closeMobileNav, navOpen, openMobileNav } = useChatContext('ChannelHeader');
  const { t } = useTranslationContext('ChannelHeader');
  const toggleNav = navOpen ? closeMobileNav : openMobileNav;
  const isMobileViewport = useIsMobileViewport();
  const showButton = mode === 'expand' ? isMobileViewport || !navOpen : canCollapse;

  return showButton ? (
    <Button
      appearance='ghost'
      aria-label={navOpen ? t('aria/Collapse sidebar') : t('aria/Expand sidebar')}
      circular
      className='str-chat__header-sidebar-toggle'
      onClick={toggleNav}
      size='md'
      variant='secondary'
      {...props}
    />
  ) : null;
};
