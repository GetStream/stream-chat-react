import { useCallback } from 'react';
import {
  PaginationFn,
  useCursorPaginator,
} from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { usePollContext } from '../../../context';

import type { DefaultStreamChatGenerics } from '../../../types';
import type { PollAnswer, PollAnswersQueryParams } from 'stream-chat';

type UsePollAnswersPaginationParams = {
  paginationParams?: PollAnswersQueryParams;
};

export const usePollAnswersPagination = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({ paginationParams }: UsePollAnswersPaginationParams = {}) => {
  const { poll } = usePollContext<StreamChatGenerics>('usePollAnswersPagination');

  const paginationFn = useCallback<PaginationFn<PollAnswer>>(
    async (next) => {
      const { next: newNext, votes } = await poll.queryAnswers({
        filter: paginationParams?.filter,
        options: !next ? paginationParams?.options : { ...paginationParams?.options, next },
        sort: { created_at: -1, ...paginationParams?.sort },
      });
      return { items: votes, next: newNext };
    },
    [paginationParams, poll],
  );

  const { error, hasNextPage, items: pollAnswers, loading, loadMore } = useCursorPaginator(
    paginationFn,
    true,
  );

  return {
    error,
    hasNextPage,
    loading,
    loadMore,
    pollAnswers,
  };
};
