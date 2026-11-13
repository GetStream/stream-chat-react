import { useMemo } from 'react';
import type { PaginatorState, ScheduledMessageResponse } from 'stream-chat';

import { useStateStore } from '../../../store';
import { NO_SCHEDULED_MESSAGES } from '../constants';
import type { UseScheduledMessageCountParams } from '../types';
import { getScopedScheduledMessages } from '../utils';
import { useScheduledMessagePaginator } from './useScheduledMessagePaginator';

const createScheduledMessageCountSelector =
  (params: UseScheduledMessageCountParams) =>
  ({ items = NO_SCHEDULED_MESSAGES }: PaginatorState<ScheduledMessageResponse>) => ({
    scheduledMessageCount: getScopedScheduledMessages(items, params).length,
  });

export const useScheduledMessageCount = ({
  cid,
  parentId,
}: UseScheduledMessageCountParams) => {
  const paginator = useScheduledMessagePaginator({ cid });

  const selector = useMemo(
    () => createScheduledMessageCountSelector({ cid, parentId }),
    [cid, parentId],
  );

  const { scheduledMessageCount } = useStateStore(paginator.state, selector);

  return scheduledMessageCount;
};
