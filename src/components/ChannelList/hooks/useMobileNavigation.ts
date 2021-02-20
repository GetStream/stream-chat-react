import { useEffect } from 'react';

export const useMobileNavigation = (
  channelListRef: React.RefObject<HTMLDivElement>,
  navOpen: boolean,
  closeMobileNav?: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
