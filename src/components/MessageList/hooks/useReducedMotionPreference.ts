import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

const getReducedMotionSnapshot = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches;
};

const subscribeToReducedMotion = (onStoreChange: () => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const mediaQueryList = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY);
  const handleChange = () => onStoreChange();

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }

  mediaQueryList.addListener(handleChange);
  return () => mediaQueryList.removeListener(handleChange);
};

export const useReducedMotionPreference = () =>
  useSyncExternalStore(subscribeToReducedMotion, getReducedMotionSnapshot, () => false);
