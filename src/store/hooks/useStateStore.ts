import { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { StateStore } from '@stream-io/state-store';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const areSelectionsEqual = <
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(
  cached: O,
  next: O,
) => {
  let cachedKeyCount = 0;

  for (const key in cached) {
    if (cached[key] !== next[key]) return false;
    cachedKeyCount += 1;
  }

  let nextKeyCount = 0;
  for (const key in next) {
    if (!(key in cached)) return false;
    nextKeyCount += 1;
  }

  return cachedKeyCount === nextKeyCount;
};

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

      // The store value changed but the selection may not have: keep the cached one when both
      // have the same keys and every key holds the same value.
      if (cachedTuple && areSelectionsEqual(cachedTuple[1], newlySelected)) {
        return cachedTuple[1];
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
