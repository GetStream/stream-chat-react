import { LiveLocationManager } from 'stream-chat';
import { useEffect, useMemo } from 'react';
import type {
  ExtendableGenerics,
  LiveLocationManagerConstructorParameters,
  StreamChat,
} from 'stream-chat';

export const useLiveLocationSharingManager = <SCG extends ExtendableGenerics>({
  client,
  retrieveAndDeserialize,
  serializeAndStore,
  watchLocation,
}: Omit<LiveLocationManagerConstructorParameters<SCG>, 'client'> & {
  client?: StreamChat<SCG> | null;
}) => {
  const manager = useMemo(() => {
    if (!client) return null;

    return new LiveLocationManager<SCG>({
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
