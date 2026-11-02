import { useEffect, useState } from 'react';

/**
 * Whether `scrollElement` has scrolled within the last `idleMs` milliseconds. Turns `true` on the
 * first `scroll` event and back to `false` once no further `scroll` event arrives for `idleMs`.
 */
export const useIsScrolling = (
  scrollElement: HTMLElement | Window | null,
  idleMs: number,
) => {
  // Holds the element that is scrolling, so a replaced `scrollElement` never reads as scrolling.
  const [scrollingElement, setScrollingElement] = useState<HTMLElement | Window | null>(
    null,
  );

  useEffect(() => {
    if (!scrollElement) return;

    let idleTimeout: ReturnType<typeof setTimeout> | undefined;
    const handleScroll = () => {
      setScrollingElement(scrollElement);
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => setScrollingElement(null), idleMs);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      clearTimeout(idleTimeout);
      // The idle timer that would end this scroll is gone, so the scroll ends here.
      setScrollingElement((current) => (current === scrollElement ? null : current));
    };
  }, [idleMs, scrollElement]);

  return scrollingElement !== null && scrollingElement === scrollElement;
};
