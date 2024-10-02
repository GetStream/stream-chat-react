import { useCallback } from 'react';
import { usePoll } from './usePoll';
import {
  PaginationFn,
  useCursorPaginator,
} from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';

import type { DefaultStreamChatGenerics } from '../../../types';
import type { PollOptionVotesQueryParams, PollVote } from 'stream-chat';

type UsePollOptionVotesPaginationParams = {
  paginationParams: PollOptionVotesQueryParams;
};

export const usePollOptionVotesPagination = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  paginationParams,
}: UsePollOptionVotesPaginationParams) => {
  const poll = usePoll<StreamChatGenerics>();

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

  const { error, hasNextPage, items: votes, loading, loadMore, next } = useCursorPaginator(
    paginationFn,
    true,
  );

  return {
    error,
    hasNextPage,
    loading,
    loadMore,
    next,
    votes,
  };
};
