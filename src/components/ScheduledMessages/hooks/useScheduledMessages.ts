import { useEffect, useMemo } from 'react';
import type {
  PaginatorState,
  ScheduledMessageResponse,
  ScheduledMessagesView,
  ScheduledMessagesViewState,
} from 'stream-chat';

import { useStateStore } from '../../../store';

const NO_SCHEDULED_MESSAGES: ScheduledMessageResponse[] = [];

const selectItems = ({ items }: ScheduledMessagesViewState) => ({ items });

const createAwaitsFirstPageSelector =
  (view: ScheduledMessagesView) =>
  ({ isLoading, lastQueryError }: PaginatorState<ScheduledMessageResponse>) => ({
    awaitsFirstPage: !view.paginator.hasLoadedPage && !isLoading && !lastQueryError,
  });

/**
 * The messages of an SDK scheduled-message view: `channel.scheduledMessages`,
 * `thread.scheduledMessages`, or a view of a list registered with
 * `client.scheduledMessagePaginators`. Keeps the view following its paginator while mounted, and
 * loads the first page unless one is loaded, as `ChannelList` does.
 */
export const useScheduledMessages = (view: ScheduledMessagesView) => {
  useEffect(() => {
    view.registerSubscriptions();
    return () => {
      view.unregisterSubscriptions();
    };
  }, [view]);

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

  const { items } = useStateStore(view.state, selectItems);
  return { scheduledMessages: items ?? NO_SCHEDULED_MESSAGES };
};
