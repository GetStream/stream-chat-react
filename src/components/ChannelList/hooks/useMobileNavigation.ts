import { useEffect } from 'react';

const MOBILE_NAV_BREAKPOINT = 768;

export const useMobileNavigation = (
  channelListRef: React.RefObject<HTMLDivElement | null>,
  navOpen: boolean,
  closeMobileNav?: () => void,
) => {
  useEffect(() => {
    const isClickInsideChannelList = (event: MouseEvent) => {
      const channelListElement = channelListRef.current;

      if (!channelListElement) return false;

      const eventPath = event.composedPath();

      // `event.target` may become detached before this document listener runs.
      // Use composedPath to reliably detect whether the click originated inside.
      return eventPath.includes(channelListElement);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth >= MOBILE_NAV_BREAKPOINT) {
        return;
      }
      if (
        closeMobileNav &&
        channelListRef.current &&
        !isClickInsideChannelList(event) &&
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
