import { useEffect, useMemo } from 'react';
import { ScheduledMessagePaginator } from 'stream-chat';
import type { PaginatorState, ScheduledMessageResponse, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { getChannelByCid, scopeScheduledMessages } from '../utils';

const ALL_SCHEDULED_MESSAGES_PAGINATOR_ID = 'stream-chat-react-scheduled-messages';

const allScheduledMessagesPaginators = new WeakMap<
  StreamChat,
  ScheduledMessagePaginator
>();

/** One list of all the user's scheduled messages per client, shared by every component. */
const getAllScheduledMessagesPaginator = (client: StreamChat) => {
  const registered = client.scheduledMessagePaginators.getPaginatorById(
    ALL_SCHEDULED_MESSAGES_PAGINATOR_ID,
  );
  if (registered) return registered;
  let paginator = allScheduledMessagesPaginators.get(client);
  if (!paginator) {
    paginator = new ScheduledMessagePaginator({
      client,
      id: ALL_SCHEDULED_MESSAGES_PAGINATOR_ID,
    });
    allScheduledMessagesPaginators.set(client, paginator);
  }
  return paginator;
};

const NO_SCHEDULED_MESSAGES: ScheduledMessageResponse[] = [];

const selectItems = ({ items }: PaginatorState<ScheduledMessageResponse>) => ({ items });

const createAwaitsFirstPageSelector =
  (paginator: ScheduledMessagePaginator) =>
  ({ isLoading, lastQueryError }: PaginatorState<ScheduledMessageResponse>) => ({
    awaitsFirstPage: !paginator.hasLoadedPage && !isLoading && !lastQueryError,
  });

export type UseScheduledMessagesParams = {
  /** The channel whose scheduled messages to list; all of them without it. */
  cid?: string;
  /** The thread whose scheduled replies to list. */
  parentId?: string;
};

/**
 * The scheduled messages of a channel (its own list, filled by the channel query), a thread in it,
 * or all of them (a list registered with the client, so events reach it). Loads the first page
 * unless one is loaded, as `ChannelList` does.
 */
export const useScheduledMessages = ({
  cid,
  parentId,
}: UseScheduledMessagesParams = {}) => {
  const { client } = useChatContext();
  const paginator = cid
    ? getChannelByCid(client, cid).scheduledMessagesPaginator
    : getAllScheduledMessagesPaginator(client);

  // after render, as registering publishes the manager's state
  useEffect(() => {
    const { scheduledMessagePaginators } = client;
    if (cid || scheduledMessagePaginators.getPaginatorById(paginator.id)) return;
    scheduledMessagePaginators.insertPaginator({ paginator });
  }, [cid, client, paginator]);

  const awaitsFirstPageSelector = useMemo(
    () => createAwaitsFirstPageSelector(paginator),
    [paginator],
  );
  const { awaitsFirstPage } = useStateStore(paginator.state, awaitsFirstPageSelector);
  useEffect(() => {
    if (awaitsFirstPage) paginator.toTailDebounced();
  }, [awaitsFirstPage, paginator]);

  const { items } = useStateStore(paginator.state, selectItems);
  const scheduledMessages = useMemo(
    () =>
      items ? scopeScheduledMessages(items, { cid, parentId }) : NO_SCHEDULED_MESSAGES,
    [cid, items, parentId],
  );

  return { paginator, scheduledMessages };
};
