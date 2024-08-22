import { useEffect, useState } from 'react';

import type { StateStore } from 'stream-chat';

export const useStateStore = <T extends Record<string, unknown>, O extends readonly unknown[]>(
  store: StateStore<T>,
  selector: (v: T) => O,
) => {
  const [state, setState] = useState<O>(selector(store.getLatestValue()));

  useEffect(() => {
    const unsubscribe = store.subscribeWithSelector(selector, setState);

    return unsubscribe;
  }, [store, selector]);

  return state;
};
