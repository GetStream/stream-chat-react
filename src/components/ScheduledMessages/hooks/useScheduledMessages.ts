import { useMemo } from 'react';
import type {
  PaginatorState,
  ScheduledMessageManagerState,
  ScheduledMessageResponse,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { NO_SCHEDULED_MESSAGES } from '../constants';
import type { ScheduledMessagesSnapshot, UseScheduledMessagesParams } from '../types';
import { getScopedScheduledMessages } from '../utils';
import { useScheduledMessagePaginator } from './useScheduledMessagePaginator';

const managerStateSelector = ({ isDisabled }: ScheduledMessageManagerState) => ({
  isDisabled,
});

const paginatorStateSelector = ({
  isLoading,
  items,
}: PaginatorState<ScheduledMessageResponse>) => ({ isLoading, items });

export const useScheduledMessages = ({
  cid,
  parentId,
}: UseScheduledMessagesParams = {}) => {
  const { client } = useChatContext();

  const paginator = useScheduledMessagePaginator({ cid });
  const { isDisabled } = useStateStore(
    client.scheduledMessages.state,
    managerStateSelector,
  );
  const { isLoading, items } = useStateStore(paginator.state, paginatorStateSelector);

  const scheduledMessages = useMemo(
    () =>
      items
        ? getScopedScheduledMessages(items, { cid, parentId })
        : NO_SCHEDULED_MESSAGES,
    [cid, items, parentId],
  );

  const scheduledMessagesSnapshot: ScheduledMessagesSnapshot = {
    isDisabled,
    isLoaded: !!items,
    isLoading,
    scheduledMessages,
  };

  return scheduledMessagesSnapshot;
};
