import { useMemo } from 'react';
import type {
  ScheduledMessageManager,
  ScheduledMessageManagerState,
  ScheduledMessageResponse,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

export type UseScheduledMessagesParams = {
  cid?: string;
  parentId?: string;
};

export type ScheduledMessagesSnapshot = {
  isDisabled: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  scheduledMessages: ScheduledMessageResponse[];
};

const byScheduledAt = (a: ScheduledMessageResponse, b: ScheduledMessageResponse) =>
  Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at) || a.id.localeCompare(b.id);

const isSameList = (
  current: ScheduledMessageResponse[],
  previous: ScheduledMessageResponse[],
) =>
  current.length === previous.length &&
  current.every((scheduledMessage, index) => scheduledMessage === previous[index]);

const getScopedScheduledMessages = (
  manager: ScheduledMessageManager,
  { cid, parentId }: UseScheduledMessagesParams,
) => {
  if (parentId) return manager.getForThread(parentId);

  if (cid) return manager.getForChannel(cid);

  const allScheduledMessages = Array.from(manager.scheduledMessages.values());

  return allScheduledMessages.sort(byScheduledAt);
};

const createScheduledMessagesSelector = (
  manager: ScheduledMessageManager,
  params: UseScheduledMessagesParams,
) => {
  let cachedScheduledMessages: ScheduledMessageResponse[] = [];

  return ({
    isDisabled,
    isLoaded,
    isLoading,
  }: ScheduledMessageManagerState): ScheduledMessagesSnapshot => {
    const scheduledMessages = getScopedScheduledMessages(manager, params);

    if (!isSameList(scheduledMessages, cachedScheduledMessages)) {
      cachedScheduledMessages = scheduledMessages;
    }

    return {
      isDisabled,
      isLoaded,
      isLoading,
      scheduledMessages: cachedScheduledMessages,
    };
  };
};

export const useScheduledMessages = ({
  cid,
  parentId,
}: UseScheduledMessagesParams = {}) => {
  const { client } = useChatContext('useScheduledMessages');
  const { scheduledMessages: manager } = client;

  const selector = useMemo(
    () => createScheduledMessagesSelector(manager, { cid, parentId }),
    [cid, manager, parentId],
  );

  const scheduledMessagesSnapshot = useStateStore(manager.state, selector);

  return scheduledMessagesSnapshot;
};
