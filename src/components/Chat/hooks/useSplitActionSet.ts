import { useMemo } from 'react';

export const useSplitActionSet = <
  T extends { placement: 'quick' } | { placement: 'dropdown' },
>(
  actionSet: T[],
) =>
  useMemo(() => {
    const quickActionSet: Extract<T, { placement: 'quick' }>[] = [];
    const dropdownActionSet: Extract<T, { placement: 'dropdown' }>[] = [];

    for (const action of actionSet) {
      if (action.placement === 'quick')
        quickActionSet.push(action as (typeof quickActionSet)[number]);
      if (action.placement === 'dropdown')
        dropdownActionSet.push(action as (typeof dropdownActionSet)[number]);
    }

    return { dropdownActionSet, quickActionSet } as const;
  }, [actionSet]);
