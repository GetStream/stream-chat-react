import { useMemo } from 'react';

import type {
  DropdownMessageActionSetItem,
  MessageActionSetItem,
  QuickMessageActionSetItem,
} from '../MessageActions';

export const useSplitMessageActionSet = (messageActionSet: MessageActionSetItem[]) =>
  useMemo(() => {
    const quickActionSet: QuickMessageActionSetItem[] = [];
    const dropdownActionSet: DropdownMessageActionSetItem[] = [];

    for (const action of messageActionSet) {
      if (action.placement === 'quick') quickActionSet.push(action);
      if (action.placement === 'dropdown') dropdownActionSet.push(action);
    }

    return { dropdownActionSet, quickActionSet } as const;
  }, [messageActionSet]);
