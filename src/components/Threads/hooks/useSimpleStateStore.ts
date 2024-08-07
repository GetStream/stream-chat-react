import { useEffect, useState } from 'react';

import type { SimpleStateStore } from 'stream-chat';

export const useSimpleStateStore = <T, O extends readonly unknown[]>(
  store: SimpleStateStore<T>,
  selector: (v: T) => O,
) => {
  const [state, setState] = useState<O>(selector(store.getLatestValue()));

  useEffect(() => {
    const unsubscribe = store.subscribeWithSelector(selector, setState);

    return unsubscribe;
  }, [store, selector]);

  return state;
};
