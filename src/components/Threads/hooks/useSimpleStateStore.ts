import { useEffect, useRef, useState } from 'react';

import type { SimpleStateStore } from 'stream-chat';

export const useSimpleStateStore = <T, O extends readonly unknown[]>(
  store: SimpleStateStore<T>,
  selector: (v: T) => O,
) => {
  const [state, setState] = useState<O>(selector(store.getLatestValue()));
  const stateRef = useRef<O>(state);

  useEffect(() => {
    const unsubscribe = store.subscribe((newValue) => {
      // calling selector should always produce new array
      const selectedValues = selector(newValue);

      // check for unequal members
      // do not trigger re-render unless members have changed
      const hasUnequalMembers = stateRef.current.some(
        (value, index) => selectedValues[index] !== value,
      );

      if (hasUnequalMembers) {
        stateRef.current = selectedValues;
        setState(selectedValues);
      }
    });

    return unsubscribe;
  }, [store, selector]);

  return state;
};
