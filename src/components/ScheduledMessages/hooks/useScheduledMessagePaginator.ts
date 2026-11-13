import { useEffect, useMemo } from 'react';
import type {
  PaginatorState,
  ScheduledMessageManager,
  ScheduledMessagePaginator,
  ScheduledMessageResponse,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { UseScheduledMessagePaginatorParams } from '../types';

const createPaginatorSelector =
  (manager: ScheduledMessageManager, cid?: string) => () => ({
    paginator: cid ? manager.getChannelPaginator(cid) : manager.paginator,
  });

const createAwaitsFirstPageSelector =
  (paginator: ScheduledMessagePaginator) =>
  ({ isLoading, lastQueryError }: PaginatorState<ScheduledMessageResponse>) => ({
    awaitsFirstPage: !paginator.hasLoadedPage && !isLoading && !lastQueryError,
  });

export const useScheduledMessagePaginator = ({
  cid,
}: UseScheduledMessagePaginatorParams = {}) => {
  const { client } = useChatContext();
  const { scheduledMessages: manager } = client;

  const paginatorSelector = useMemo(
    () => createPaginatorSelector(manager, cid),
    [cid, manager],
  );
  const { paginator } = useStateStore(manager.state, paginatorSelector);

  const awaitsFirstPageSelector = useMemo(
    () => createAwaitsFirstPageSelector(paginator),
    [paginator],
  );
  const { awaitsFirstPage } = useStateStore(paginator.state, awaitsFirstPageSelector);

  useEffect(() => {
    if (!awaitsFirstPage) return;

    paginator.toTailDebounced();
  }, [awaitsFirstPage, paginator]);

  return paginator;
};
