import { useCallback } from 'react';
import type { PaginatorState, ScheduledMessageResponse } from 'stream-chat';

import { useStateStore } from '../../../store';
import { getFirstPageLoadError } from '../../Loading/getFirstPageLoadError';
import type {
  ScheduledMessagesLoadState,
  UseScheduledMessagePaginatorParams,
} from '../types';
import { useScheduledMessagePaginator } from './useScheduledMessagePaginator';

const loadStateSelector = (state: PaginatorState<ScheduledMessageResponse>) => ({
  hasLoadFailed: !!getFirstPageLoadError(state),
  isFirstLoad: state.items === undefined && !state.lastQueryError,
});

const ignoreErrorKeptInState = () => undefined;

export const useScheduledMessagesLoadState = ({
  cid,
}: UseScheduledMessagePaginatorParams = {}) => {
  const paginator = useScheduledMessagePaginator({ cid });

  const { hasLoadFailed, isFirstLoad } = useStateStore(
    paginator.state,
    loadStateSelector,
  );

  const reload = useCallback(() => {
    paginator.reload().catch(ignoreErrorKeptInState);
  }, [paginator]);

  const scheduledMessagesLoadState: ScheduledMessagesLoadState = {
    hasLoadFailed,
    isFirstLoad,
    reload,
  };

  return scheduledMessagesLoadState;
};
