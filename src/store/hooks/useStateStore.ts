import { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { StateStore } from '@stream-io/state-store';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export function useStateStore<
  T extends Record<string, unknown>,
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(store: StateStore<T>, selector: (v: T) => O): O;
export function useStateStore<
  T extends Record<string, unknown>,
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(store: StateStore<T> | undefined, selector: (v: T) => O): O | undefined;
export function useStateStore<
  T extends Record<string, unknown>,
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(store: StateStore<T> | undefined, selector: (v: T) => O) {
  const wrappedSubscription = useCallback(
    (onStoreChange: () => void) => {
      const unsubscribe = store?.subscribeWithSelector(selector, onStoreChange);
      return unsubscribe ?? noop;
    },
    [store, selector],
  );

  const wrappedSnapshot = useMemo(() => {
    let cachedTuple: [T, O];

    return () => {
      const currentValue = store?.getLatestValue();

      if (!currentValue) return undefined;

      // The store value is unchanged, so reuse the cached selection.
      if (cachedTuple && cachedTuple[0] === currentValue) {
        return cachedTuple[1];
      }

      const newlySelected = selector(currentValue);

      // The store value changed but the selection may not have: keep the cached one when every
      // cached key holds the same value.
      if (cachedTuple) {
        let selectededAreEqualToCached = true;

        for (const key in cachedTuple[1]) {
          if (cachedTuple[1][key] === newlySelected[key]) continue;
          selectededAreEqualToCached = false;
          break;
        }

        if (selectededAreEqualToCached) return cachedTuple[1];
      }

      cachedTuple = [currentValue, newlySelected];
      return cachedTuple[1];
    };
  }, [store, selector]);

  const state = useSyncExternalStore(
    wrappedSubscription,
    wrappedSnapshot,
    wrappedSnapshot,
  );

  return state;
}
