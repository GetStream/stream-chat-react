import { useMemo } from 'react';

import type { ScheduledMessageGroups, UseScheduledMessageGroupsParams } from '../types';
import { filterScheduledMessagesByText, groupScheduledMessages } from '../utils';
import { useScheduledMessages } from './useScheduledMessages';

export const useScheduledMessageGroups = ({
  cid,
  parentId,
  searchQuery,
}: UseScheduledMessageGroupsParams) => {
  const { isLoaded, scheduledMessages } = useScheduledMessages({ cid, parentId });

  const groups = useMemo(
    () =>
      groupScheduledMessages(
        filterScheduledMessagesByText(scheduledMessages, searchQuery),
      ),
    [scheduledMessages, searchQuery],
  );

  const scheduledMessageGroups: ScheduledMessageGroups = {
    groups,
    hasScheduledMessages: scheduledMessages.length > 0,
    isLoaded,
  };

  return scheduledMessageGroups;
};
