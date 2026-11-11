import { useMemo } from 'react';
import type { ScheduledMessageManager } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { UseScheduledMessageCountParams } from '../types';
import { isFailedScheduledMessage } from '../utils';

const createFailedScheduledMessageCountSelector = (
  manager: ScheduledMessageManager,
  { cid, parentId }: UseScheduledMessageCountParams,
) => {
  const getScopedScheduledMessages = () =>
    parentId ? manager.getForThread(parentId) : manager.getForChannel(cid);

  return () => ({
    failedScheduledMessageCount: getScopedScheduledMessages().filter(
      isFailedScheduledMessage,
    ).length,
  });
};

export const useFailedScheduledMessageCount = ({
  cid,
  parentId,
}: UseScheduledMessageCountParams) => {
  const { client } = useChatContext('useFailedScheduledMessageCount');
  const { scheduledMessages: manager } = client;

  const selector = useMemo(
    () => createFailedScheduledMessageCountSelector(manager, { cid, parentId }),
    [cid, manager, parentId],
  );

  const { failedScheduledMessageCount } = useStateStore(manager.state, selector);

  return failedScheduledMessageCount;
};
