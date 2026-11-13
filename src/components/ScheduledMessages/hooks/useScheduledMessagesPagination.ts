import { useCallback } from 'react';
import type { PaginatorState, ScheduledMessageResponse } from 'stream-chat';

import { useStateStore } from '../../../store';
import type {
  ScheduledMessagesPagination,
  UseScheduledMessagePaginatorParams,
} from '../types';
import { useScheduledMessagePaginator } from './useScheduledMessagePaginator';

const paginationSelector = ({
  hasMoreTail,
  isLoading,
  items,
}: PaginatorState<ScheduledMessageResponse>) => ({
  canLoadMore: !!items && hasMoreTail,
  isLoading,
});

const ignoreErrorKeptInState = () => undefined;

export const useScheduledMessagesPagination = ({
  cid,
}: UseScheduledMessagePaginatorParams = {}) => {
  const paginator = useScheduledMessagePaginator({ cid });

  const { canLoadMore, isLoading } = useStateStore(paginator.state, paginationSelector);

  const loadMore = useCallback(() => {
    paginator.toTail().catch(ignoreErrorKeptInState);
  }, [paginator]);

  const scheduledMessagesPagination: ScheduledMessagesPagination = {
    canLoadMore,
    isLoading,
    loadMore,
  };

  return scheduledMessagesPagination;
};
