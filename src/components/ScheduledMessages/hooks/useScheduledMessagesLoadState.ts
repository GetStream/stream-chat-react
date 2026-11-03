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

const ignoreErrorKeptInState = () => undefined;

export const useScheduledMessagesLoadState = () => {
  const { client } = useChatContext();
  const { scheduledMessages: manager } = client;

  const { hasLoadFailed, isFirstLoad } = useStateStore(manager.state, loadStateSelector);

  const reload = useCallback(() => {
    manager.load().catch(ignoreErrorKeptInState);
  }, [manager]);

  const scheduledMessagesLoadState: ScheduledMessagesLoadState = {
    hasLoadFailed,
    isFirstLoad,
    reload,
  };

  return scheduledMessagesLoadState;
};
