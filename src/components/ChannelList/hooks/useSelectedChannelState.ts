import { useCallback } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { Channel, EventTypes, ExtendableGenerics } from 'stream-chat';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export function useSelectedChannelState<SCG extends ExtendableGenerics, O>(_: {
  channel: Channel<SCG>;
  selector: (channel: Channel<SCG>) => O;
  stateChangeEventKeys?: EventTypes[];
}): O;
export function useSelectedChannelState<SCG extends ExtendableGenerics, O>(_: {
  selector: (channel: Channel<SCG>) => O;
  channel?: Channel<SCG> | undefined;
  stateChangeEventKeys?: EventTypes[];
}): O | undefined;
export function useSelectedChannelState<SCG extends ExtendableGenerics, O>({
  channel,
  stateChangeEventKeys = ['all'],
  selector,
}: {
  selector: (channel: Channel<SCG>) => O;
  channel?: Channel<SCG>;
  stateChangeEventKeys?: EventTypes[];
}): O | undefined {
  const subscribe = useCallback(
    (onStoreChange: (value: O) => void) => {
      if (!channel) return noop;

      const subscriptions = stateChangeEventKeys.map((et) =>
        channel.on(et, () => {
          onStoreChange(selector(channel));
        }),
      );

      return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    },
    [channel, selector, stateChangeEventKeys],
  );

  const getSnapshot = useCallback(() => {
    if (!channel) return undefined;

    return selector(channel);
  }, [channel, selector]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
