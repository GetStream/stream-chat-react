import { useMemo } from 'react';
import type { PaginatorState, ScheduledMessageResponse } from 'stream-chat';

import { useStateStore } from '../../../store';
import { NO_SCHEDULED_MESSAGES } from '../constants';
import type { UseScheduledMessageCountParams } from '../types';
import { getScopedScheduledMessages, isFailedScheduledMessage } from '../utils';
import { useScheduledMessagePaginator } from './useScheduledMessagePaginator';

const createFailedScheduledMessageCountSelector =
  (params: UseScheduledMessageCountParams) =>
  ({ items = NO_SCHEDULED_MESSAGES }: PaginatorState<ScheduledMessageResponse>) => ({
    failedScheduledMessageCount: getScopedScheduledMessages(items, params).filter(
      isFailedScheduledMessage,
    ).length,
  });

export const useFailedScheduledMessageCount = ({
  cid,
  parentId,
}: UseScheduledMessageCountParams) => {
  const paginator = useScheduledMessagePaginator({ cid });

  const selector = useMemo(
    () => createFailedScheduledMessageCountSelector({ cid, parentId }),
    [cid, parentId],
  );

  const { failedScheduledMessageCount } = useStateStore(paginator.state, selector);

  return failedScheduledMessageCount;
};
