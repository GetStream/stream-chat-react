import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { StateStore } from 'stream-chat';

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
    let cached: [T, O];
    return () => {
      const current = store?.getLatestValue();

      if (!current) return undefined;

      if (!cached || cached[0] !== current) {
        cached = [current, selector(current)];
        return cached[1];
      }

      return cached[1];
    };
  }, [store, selector]);

  const state = useSyncExternalStore(wrappedSubscription, wrappedSnapshot);

  return state;
}
