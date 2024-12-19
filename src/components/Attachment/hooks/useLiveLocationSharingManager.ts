import { LiveLocationManager } from 'stream-chat';
import type { LiveLocationManagerConstructorParameters } from 'stream-chat';
import { useEffect, useMemo } from 'react';

type PartialKeys<T, K extends keyof T> = {
  [L in keyof T]: L extends K ? T[L] | undefined : T[L];
};

export const useLiveLocationSharingManager = ({
  client,
  retrieveAndDeserialize,
  serializeAndStore,
  watchLocation,
}: PartialKeys<LiveLocationManagerConstructorParameters, 'client'>) => {
  const manager = useMemo(() => {
    if (!client) return null;

    return new LiveLocationManager({
      client,
      retrieveAndDeserialize,
      serializeAndStore,
      watchLocation,
    });
  }, [client, retrieveAndDeserialize, serializeAndStore, watchLocation]);

  useEffect(() => {
    if (!manager) return;

    manager.registerSubscriptions();

    return () => manager.unregisterSubscriptions();
  }, [manager]);

  return manager;
};
