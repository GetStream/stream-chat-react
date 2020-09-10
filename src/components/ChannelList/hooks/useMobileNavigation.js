// @ts-check

import { useEffect } from 'react';

/**
 * @param {React.MutableRefObject<HTMLDivElement | null>} channelListRef
 * @param {boolean} navOpen
 * @param {() => void} [closeMobileNav]
 */
export const useMobileNavigation = (
  channelListRef,
  navOpen,
  closeMobileNav,
) => {
  useEffect(() => {
    /** @param {MouseEvent} e */
    const handleClickOutside = (e) => {
      if (
        closeMobileNav &&
        channelListRef.current &&
        !channelListRef.current.contains(
          /** @type {Node | null} */ (e.target),
        ) &&
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
