import { LiveLocationManager } from 'stream-chat';
import { useEffect, useMemo } from 'react';
import type { LiveLocationManagerConstructorParameters, StreamChat } from 'stream-chat';

const isMobile = () => /Mobi/i.test(navigator.userAgent);
/** Whether the user agent matches Safari. False without `navigator`. */
export const isSafari = () => {
  if (typeof navigator === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent || '');
};

/** Whether the user agent matches Firefox. False without `navigator`. */
export const isFirefox = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent?.includes('Firefox');
};

/** Whether the user agent matches Chrome. False without `navigator`. */
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
      // `unregisterSubscriptions` is ref-counted and releases the WebSocket subscriptions;
      // `dispose` releases the configuration subscription, without which the client's
      // configuration registry keeps every memoized manager alive. StrictMode's cleanup between
      // two mounts of one instance is safe: `init` re-subscribes the configuration if disposed.
      manager.unregisterSubscriptions();
      manager.dispose();
    };
  }, [manager]);

  return manager;
};
