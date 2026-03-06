import { useEffect } from 'react';

const MOBILE_NAV_BREAKPOINT = 768;

export const useMobileNavigation = (
  channelListRef: React.RefObject<HTMLDivElement | null>,
  navOpen: boolean,
  closeMobileNav?: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth >= MOBILE_NAV_BREAKPOINT) {
        return;
      }
      if (
        closeMobileNav &&
        channelListRef.current &&
        !channelListRef.current.contains(event.target as Node) &&
        navOpen
      ) {
        closeMobileNav();
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [channelListRef, closeMobileNav, navOpen]);
};
