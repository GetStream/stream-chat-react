import { useEffect, useMemo } from 'react';
import type {
  PaginatorState,
  ScheduledMessageResponse,
  ScheduledMessagesView,
} from 'stream-chat';

import { useStateStore } from '../../../store';
import { useScheduledMessages } from './useScheduledMessages';

const createAwaitsFirstPageSelector =
  (view: ScheduledMessagesView) =>
  ({ isLoading, lastQueryError }: PaginatorState<ScheduledMessageResponse>) => ({
    awaitsFirstPage: !view.paginator.hasLoadedPage && !isLoading && !lastQueryError,
  });

/**
 * The messages of a view of a list registered with `client.scheduledMessagePaginators`, e.g. the
 * user's scheduled messages in every channel. Nothing else loads such a list, so this loads its
 * first page, as `ChannelList` does; not again after a failed load, which the UI retries.
 */
export const useScheduledMessageList = (view: ScheduledMessagesView) => {
  const awaitsFirstPageSelector = useMemo(
    () => createAwaitsFirstPageSelector(view),
    [view],
  );
  const { awaitsFirstPage } = useStateStore(
    view.paginator.state,
    awaitsFirstPageSelector,
  );

  useEffect(() => {
    if (awaitsFirstPage) view.toTailDebounced();
  }, [awaitsFirstPage, view]);

  return useScheduledMessages(view);
};
