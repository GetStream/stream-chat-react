import { useCallback } from 'react';
import { useManagePollVotesRealtime } from './useManagePollVotesRealtime';
import type {
  CursorPaginatorState,
  PaginationFn,
} from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { useCursorPaginator } from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { usePollContext } from '../../../context';

import { useStateStore } from '../../../store';
import type { PollAnswer, PollAnswersQueryParams, PollVote } from 'stream-chat';

const paginationStateSelector = (
  state: CursorPaginatorState<PollVote>,
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

  const paginationFn = useCallback<PaginationFn<PollAnswer>>(
    async (next) => {
      const { next: newNext, votes } = await poll.queryAnswers({
        filter: paginationParams?.filter,
        options: !next
          ? paginationParams?.options
          : { ...paginationParams?.options, next },
        sort: { created_at: -1, ...paginationParams?.sort },
      });
      return { items: votes, next: newNext };
    },
    [paginationParams, poll],
  );

  const { cursorPaginatorState, loadMore } = useCursorPaginator(paginationFn, true);
  const answers = useManagePollVotesRealtime<PollAnswer>('answer', cursorPaginatorState);
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
