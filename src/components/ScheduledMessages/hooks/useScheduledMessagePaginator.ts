import { useEffect, useMemo } from 'react';
import type {
  PaginatorState,
  ScheduledMessagePaginator,
  ScheduledMessageResponse,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { UseScheduledMessagePaginatorParams } from '../types';
import { getChannelByCid } from '../utils';

const createAwaitsFirstPageSelector =
  (paginator: ScheduledMessagePaginator) =>
  ({ isLoading, lastQueryError }: PaginatorState<ScheduledMessageResponse>) => ({
    awaitsFirstPage: !paginator.hasLoadedPage && !isLoading && !lastQueryError,
  });

export const useScheduledMessagePaginator = ({
  cid,
}: UseScheduledMessagePaginatorParams) => {
  const { client } = useChatContext();
  const paginator = useMemo(
    () => getChannelByCid(client, cid).scheduledMessagesPaginator,
    [cid, client],
  );

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
