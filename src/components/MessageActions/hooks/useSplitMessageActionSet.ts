import { useMemo } from 'react';

import type { MessageActionSetItem } from '../MessageActions';

export const useSplitMessageActionSet = (messageActionSet: MessageActionSetItem[]) =>
  useMemo(() => {
    const quickActionSet: MessageActionSetItem[] = [];
    const dropdownActionSet: MessageActionSetItem[] = [];

    for (const action of messageActionSet) {
      if (action.placement === 'quick') quickActionSet.push(action);
      if (action.placement === 'dropdown') dropdownActionSet.push(action);
    }

    return { dropdownActionSet, quickActionSet };
  }, [messageActionSet]);
