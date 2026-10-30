import { useMemo } from 'react';

import type { ScheduledMessageGroups, UseScheduledMessagesParams } from '../types';
import { groupScheduledMessages } from '../utils';
import { useScheduledMessages } from './useScheduledMessages';

export const useScheduledMessageGroups = ({
  cid,
  parentId,
}: UseScheduledMessagesParams) => {
  const { isLoaded, scheduledMessages } = useScheduledMessages({ cid, parentId });

  const groups = useMemo(
    () => groupScheduledMessages(scheduledMessages),
    [scheduledMessages],
  );

  const scheduledMessageGroups: ScheduledMessageGroups = { groups, isLoaded };

  return scheduledMessageGroups;
};
