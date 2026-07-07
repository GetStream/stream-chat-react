import { useCallback } from 'react';
import { useManagePollVotesRealtime } from './useManagePollVotesRealtime';
import type {
  CursorPaginatorState,
  PaginationFn,
} from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { useCursorPaginator } from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { useStateStore } from '../../../store';
import { usePollContext } from '../../../context';

import type { PollOptionVotesQueryParams, PollVoteResponseData } from 'stream-chat';

const paginationStateSelector = (
  state: CursorPaginatorState<PollVoteResponseData>,
): [Error | undefined, boolean, boolean] => [
  state.error,
  state.hasNextPage,
  state.loading,
];

type UsePollOptionVotesPaginationParams = {
  paginationParams: PollOptionVotesQueryParams;
};

export const usePollOptionVotesPagination = ({
  paginationParams,
}: UsePollOptionVotesPaginationParams) => {
  const { poll } = usePollContext();

  const paginationFn = useCallback<PaginationFn<PollVoteResponseData>>(
    async (next) => {
      const { next: newNext, votes } = await poll.queryOptionVotes({
        filter: paginationParams.filter,
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
  const votes = useManagePollVotesRealtime<PollVoteResponseData>(
    'vote',
    cursorPaginatorState,
    paginationParams.filter.option_id,
  );
  const [error, hasNextPage, loading] = useStateStore(
    cursorPaginatorState,
    paginationStateSelector,
  );

  return {
    error,
    hasNextPage,
    loading,
    loadMore,
    votes,
  };
};
