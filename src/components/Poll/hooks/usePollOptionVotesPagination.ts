import { useCallback } from 'react';
import { useManagePollVotesRealtime } from './useManagePollVotesRealtime';
import {
  CursorPaginatorState,
  PaginationFn,
  useCursorPaginator,
} from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { useStateStore } from '../../../store';
import { usePollContext } from '../../../context';

import type { DefaultStreamChatGenerics } from '../../../types';
import type { PollOptionVotesQueryParams, PollVote } from 'stream-chat';

const paginationStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  state: CursorPaginatorState<PollVote<StreamChatGenerics>>,
): [Error | undefined, boolean, boolean] => [state.error, state.hasNextPage, state.loading];

type UsePollOptionVotesPaginationParams = {
  paginationParams: PollOptionVotesQueryParams;
};

export const usePollOptionVotesPagination = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  paginationParams,
}: UsePollOptionVotesPaginationParams) => {
  const { poll } = usePollContext<StreamChatGenerics>();

  const paginationFn = useCallback<PaginationFn<PollVote<StreamChatGenerics>>>(
    async (next) => {
      const { next: newNext, votes } = await poll.queryOptionVotes({
        filter: paginationParams.filter,
        options: !next ? paginationParams?.options : { ...paginationParams?.options, next },
        sort: { created_at: -1, ...paginationParams?.sort },
      });
      return { items: votes, next: newNext };
    },
    [paginationParams, poll],
  );

  const { cursorPaginatorState, loadMore } = useCursorPaginator(paginationFn, true);
  const votes = useManagePollVotesRealtime<StreamChatGenerics, PollVote<StreamChatGenerics>>(
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
