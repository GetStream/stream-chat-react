import { useCallback } from 'react';
import type { ScheduledMessageManagerState } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { ScheduledMessagesPagination } from '../types';

const paginationSelector = ({ isLoading, next }: ScheduledMessageManagerState) => ({
  canLoadMore: !!next,
  isLoading,
});

const ignoreErrorKeptInState = () => undefined;

export const useScheduledMessagesPagination = () => {
  const { client } = useChatContext();
  const { scheduledMessages: manager } = client;

  const { canLoadMore, isLoading } = useStateStore(manager.state, paginationSelector);

  const loadMore = useCallback(() => {
    manager.loadMore().catch(ignoreErrorKeptInState);
  }, [manager]);

  const scheduledMessagesPagination: ScheduledMessagesPagination = {
    canLoadMore,
    isLoading,
    loadMore,
  };

  return scheduledMessagesPagination;
};
