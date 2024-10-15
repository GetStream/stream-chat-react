import { useCallback } from 'react';
import { useManagePollVotesRealtime } from './useManagePollVotesRealtime';
import {
  CursorPaginatorState,
  PaginationFn,
  useCursorPaginator,
} from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { usePollContext } from '../../../context';

import type { DefaultStreamChatGenerics } from '../../../types';
import type { PollAnswer, PollAnswersQueryParams, PollVote } from 'stream-chat';
import { useStateStore } from '../../../store';

const paginationStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  state: CursorPaginatorState<PollVote<StreamChatGenerics>>,
): [Error | undefined, boolean, boolean] => [state.error, state.hasNextPage, state.loading];

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

  const { cursorPaginatorState, loadMore } = useCursorPaginator(paginationFn, true);
  const answers = useManagePollVotesRealtime<StreamChatGenerics, PollAnswer<StreamChatGenerics>>(
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
