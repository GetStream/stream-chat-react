import { useMemo } from 'react';
import type { ScheduledMessageManager } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

export type UseScheduledMessageCountParams = {
  cid: string;
  parentId?: string;
};

const countThreadReplies = (
  manager: ScheduledMessageManager,
  { cid, parentId }: UseScheduledMessageCountParams,
) => {
  const allScheduledMessages = Array.from(manager.scheduledMessages.values());

  const threadReplyCount = allScheduledMessages.filter(
    ({ cid: messageCid, message }) =>
      messageCid === cid && message.parent_id === parentId,
  ).length;

  return threadReplyCount;
};

const createScheduledMessageCountSelector = (
  manager: ScheduledMessageManager,
  params: UseScheduledMessageCountParams,
) => {
  const { cid, parentId } = params;

  const countScheduledMessages = () =>
    parentId ? countThreadReplies(manager, params) : manager.getCountForChannel(cid);

  return () => ({ scheduledMessageCount: countScheduledMessages() });
};

export const useScheduledMessageCount = ({
  cid,
  parentId,
}: UseScheduledMessageCountParams) => {
  const { client } = useChatContext('useScheduledMessageCount');
  const { scheduledMessages: manager } = client;

  const selector = useMemo(
    () => createScheduledMessageCountSelector(manager, { cid, parentId }),
    [cid, manager, parentId],
  );

  const { scheduledMessageCount } = useStateStore(manager.state, selector);

  return scheduledMessageCount;
};
