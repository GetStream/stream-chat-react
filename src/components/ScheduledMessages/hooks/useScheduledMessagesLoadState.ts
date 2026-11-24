import type { PaginatorState, ScheduledMessageResponse } from 'stream-chat';

import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useFirstPageLoadRetry } from '../../ListStates/hooks';
import { getFirstPageLoadError } from '../../ListStates/utils';
import type {
  ScheduledMessagesLoadState,
  UseScheduledMessagePaginatorParams,
} from '../types';
import { useScheduledMessagePaginator } from './useScheduledMessagePaginator';

const loadStateSelector = (state: PaginatorState<ScheduledMessageResponse>) => ({
  firstPageLoadError: getFirstPageLoadError(state),
  isFirstLoad: state.items === undefined && !state.lastQueryError,
});

export const useScheduledMessagesLoadState = ({
  cid,
}: UseScheduledMessagePaginatorParams) => {
  const { t } = useTranslationContext();
  const paginator = useScheduledMessagePaginator({ cid });

  const { firstPageLoadError, isFirstLoad } = useStateStore(
    paginator.state,
    loadStateSelector,
  );

  const { error, isRetrying, retry } = useFirstPageLoadRetry({
    firstPageLoadError,
    loadedMessage: t('scheduledMessages.loaded', 'Scheduled messages loaded'),
    paginator,
    reload: paginator.reload,
  });

  const scheduledMessagesLoadState: ScheduledMessagesLoadState = {
    error,
    isFirstLoad,
    isRetrying,
    retry,
  };

  return scheduledMessagesLoadState;
};
