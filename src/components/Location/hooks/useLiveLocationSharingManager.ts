import { LiveLocationManager } from 'stream-chat';
import { useEffect, useMemo } from 'react';
import type { LiveLocationManagerConstructorParameters, StreamChat } from 'stream-chat';

const isMobile = () => /Mobi/i.test(navigator.userAgent);
/**
 * Checks whether the current browser is Safari.
 */
export const isSafari = () => {
  if (typeof navigator === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent || '');
};

/**
 * Checks whether the current browser is Firefox.
 */
export const isFirefox = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent?.includes('Firefox');
};

/**
 * Checks whether the current browser is Google Chrome.
 */
export const isChrome = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent?.includes('Chrome');
};

const browser = () => {
  if (isChrome()) return 'chrome';
  if (isFirefox()) return 'firefox';
  if (isSafari()) return 'safari';
  return 'other';
};

export const useLiveLocationSharingManager = ({
  client,
  getDeviceId,
  watchLocation,
}: Omit<LiveLocationManagerConstructorParameters, 'client' | 'getDeviceId'> & {
  client?: StreamChat | null;
  getDeviceId?: () => string;
}) => {
  const manager = useMemo(() => {
    if (!client) return null;

    return new LiveLocationManager({
      client,
      getDeviceId:
        getDeviceId ??
        (() => `web-${isMobile() ? 'mobile' : 'desktop'}-${browser()}-${client.userID}`),
      watchLocation,
    });
  }, [client, getDeviceId, watchLocation]);

  useEffect(() => {
    if (!manager) return;

    manager.init();

    return () => {
      manager.unregisterSubscriptions();
    };
  }, [manager]);

  return manager;
};
