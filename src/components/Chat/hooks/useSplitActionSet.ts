import { useMemo } from 'react';

export const useSplitActionSet = <
  T extends
    | { placement: 'quick' }
    | { placement: 'dropdown' }
    | { placement: 'quick-dropdown-toggle' },
>(
  actionSet: T[],
) =>
  useMemo(() => {
    const quickActionSet: Extract<T, { placement: 'quick' }>[] = [];
    const dropdownActionSet: Extract<T, { placement: 'dropdown' }>[] = [];
    let quickDropdownToggleAction:
      | Extract<T, { placement: 'quick-dropdown-toggle' }>
      | undefined;

    for (const action of actionSet) {
      if (action.placement === 'quick')
        quickActionSet.push(action as (typeof quickActionSet)[number]);
      if (action.placement === 'dropdown')
        dropdownActionSet.push(action as (typeof dropdownActionSet)[number]);
      if (action.placement === 'quick-dropdown-toggle') {
        quickDropdownToggleAction ??= action as Extract<
          T,
          { placement: 'quick-dropdown-toggle' }
        >;
      }
    }

    return { dropdownActionSet, quickActionSet, quickDropdownToggleAction } as const;
  }, [actionSet]);
