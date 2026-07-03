/**
 * Memoizes an async factory, sharing one in-flight/resolved promise across callers —
 * but drops the memo if the promise rejects, so a later call retries instead of
 * replaying the failure forever. Used for the lazily code-split emoji dataset (and the
 * search index derived from it): a transient chunk-load failure (offline, stale deploy)
 * must not permanently disable the picker or poison the shared search index.
 */
export const memoizeAsyncWithReset = <T>(factory: () => Promise<T>) => {
  let promise: Promise<T> | null = null;
  return (): Promise<T> => {
    if (!promise) {
      promise = factory().catch((error) => {
        promise = null;
        throw error;
      });
    }
    return promise;
  };
};
