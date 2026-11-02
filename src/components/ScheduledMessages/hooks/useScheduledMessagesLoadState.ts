import { useCallback } from 'react';
import type { ScheduledMessageManagerState } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { ScheduledMessagesLoadState } from '../types';

const loadStateSelector = ({
  isLoaded,
  isLoading,
  lastQueryError,
}: ScheduledMessageManagerState) => ({
  hasLoadFailed: !isLoaded && !isLoading && !!lastQueryError,
  isFirstLoad: !isLoaded && isLoading,
});

export const useScheduledMessagesLoadState = () => {
  const { client } = useChatContext('useScheduledMessagesLoadState');
  const { scheduledMessages: manager } = client;

  const { hasLoadFailed, isFirstLoad } = useStateStore(manager.state, loadStateSelector);

  const reload = useCallback(() => {
    manager.load().catch((error: Error) =>
      client.logger('warn', 'scheduledMessages: reload failed', {
        error,
        tags: ['scheduled_messages'],
      }),
    );
  }, [client, manager]);

  const scheduledMessagesLoadState: ScheduledMessagesLoadState = {
    hasLoadFailed,
    isFirstLoad,
    reload,
  };

  return scheduledMessagesLoadState;
};
