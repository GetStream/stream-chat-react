import { useEffect } from 'react';

export const useMobileNavigation = (
  channelListRef,
  navOpen,
  closeMobileNav,
) => {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        channelListRef &&
        !channelListRef.current.contains(e.target) &&
        navOpen
      ) {
        closeMobileNav();
      }
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [navOpen, channelListRef, closeMobileNav]);
};
