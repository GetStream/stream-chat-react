import { useEffect, useState } from 'react';

import { NAV_SIDEBAR_DESKTOP_BREAKPOINT } from '../../Chat/hooks/useChat';

const mobileQuery = () =>
  typeof window !== 'undefined'
    ? window.matchMedia(`(max-width: ${NAV_SIDEBAR_DESKTOP_BREAKPOINT - 1}px)`)
    : null;

/** True when viewport width is below NAV_SIDEBAR_DESKTOP_BREAKPOINT (768px). */
export const useIsMobileViewport = (): boolean => {
  const [isMobile, setIsMobile] = useState(() => mobileQuery()?.matches ?? false);

  useEffect(() => {
    const mql = mobileQuery();
    if (!mql) return;
    const handler = () => setIsMobile(mql.matches);
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
};
