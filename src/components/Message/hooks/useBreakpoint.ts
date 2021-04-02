import { useEffect, useState } from 'react';
import throttle from 'lodash.throttle';

export type DeviceWidth = {
  device: 'mobile' | 'tablet' | 'full';
  width: number;
};

const getDeviceWidth = (width: number): DeviceWidth => {
  if (width < 768) return { device: 'mobile', width };
  if (width < 1024) return { device: 'tablet', width };
  return { device: 'full', width };
};

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState(getDeviceWidth(window.innerWidth));

  useEffect(() => {
    const getInnerWidth = throttle(() => setBreakpoint(getDeviceWidth(window.innerWidth)), 200);

    window.addEventListener('resize', getInnerWidth);
    return () => window.removeEventListener('resize', getInnerWidth);
  }, []);

  return breakpoint;
};
