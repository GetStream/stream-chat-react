import { useCallback, useRef } from 'react';

export type StableCallback<A extends unknown[], R> = (...args: A) => R;

/**
 * Returns a callback with a stable reference that always invokes the latest `callback`. It lets a
 * function that depends on state high in the tree be passed down, or listed as a hook dependency,
 * without changing its reference on every render.
 *
 * Do not wrap a function that returns a React element (e.g. a `renderItem` prop): React is not told
 * to re-render when its result changes. Prefer `useCallback` or a stable function when one works.
 *
 * @param callback - Callback to stabilize.
 * @returns A stable function that forwards its arguments to `callback` and returns its result.
 */
export const useStableCallback = <A extends unknown[], R>(
  callback: StableCallback<A, R>,
): StableCallback<A, R> => {
  const ref = useRef(callback);
  ref.current = callback;

  return useCallback<StableCallback<A, R>>((...args) => ref.current(...args), []);
};
