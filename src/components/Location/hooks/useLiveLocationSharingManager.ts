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
      // Two teardowns, because the manager has two lifetimes. `unregisterSubscriptions` is ref-counted
      // and releases the WS subscriptions; `dispose` releases the configuration subscription, which the
      // client's configuration registry holds a handle to — without it a manager per memo generation
      // accumulates for the life of the client.
      //
      // Safe to call here even though StrictMode runs cleanup between two mounts of the same instance:
      // `registerSubscriptions` (via `init`) re-subscribes configuration if it was disposed. That
      // recovery is a microtask late, because `init` awaits its state fetch first — nothing is lost,
      // since subscribing applies whatever is registered at that moment.
      manager.unregisterSubscriptions();
      manager.dispose();
    };
  }, [manager]);

  return manager;
};
