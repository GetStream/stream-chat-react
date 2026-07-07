import { useCallback } from 'react';
import { useManagePollVotesRealtime } from './useManagePollVotesRealtime';
import type {
  CursorPaginatorState,
  PaginationFn,
} from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { useCursorPaginator } from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { usePollContext } from '../../../context';

import { useStateStore } from '../../../store';
import type { PollAnswersQueryParams, PollVoteResponseData } from 'stream-chat';

const paginationStateSelector = (
  state: CursorPaginatorState<PollVoteResponseData>,
): [Error | undefined, boolean, boolean] => [
  state.error,
  state.hasNextPage,
  state.loading,
];

type UsePollAnswerPaginationParams = {
  paginationParams?: PollAnswersQueryParams;
};

export const usePollAnswerPagination = ({
  paginationParams,
}: UsePollAnswerPaginationParams = {}) => {
  const { poll } = usePollContext();

  const paginationFn = useCallback<PaginationFn<PollVoteResponseData>>(
    async (next) => {
      const { next: newNext, votes } = await poll.queryAnswers({
        filter: paginationParams?.filter,
        options: !next
          ? paginationParams?.options
          : { ...paginationParams?.options, next },
        sort: [{ direction: -1, field: 'created_at' }, ...(paginationParams?.sort ?? [])],
      });
      return { items: votes, next: newNext };
    },
    [paginationParams, poll],
  );

  const { cursorPaginatorState, loadMore } = useCursorPaginator(paginationFn, true);
  const answers = useManagePollVotesRealtime<PollVoteResponseData>(
    'answer',
    cursorPaginatorState,
  );
  const [error, hasNextPage, loading] = useStateStore(
    cursorPaginatorState,
    paginationStateSelector,
  );

  return {
    answers,
    error,
    hasNextPage,
    loading,
    loadMore,
  };
};
