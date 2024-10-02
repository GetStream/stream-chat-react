import React, { useEffect, useMemo } from 'react';
import { PollVoteListing } from '../../PollVote';
import { usePollOptionVotesPagination } from '../../hooks';
import { LoadingIndicator } from '../../../Loading';
import { InfiniteScrollPaginator } from '../../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { PollOptionWithVotesHeader } from './PollOptionWithVotesHeader';
import type { PollOption, PollOptionVotesQueryParams } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../../types';

export type PollOptionVotesListingProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  option: PollOption<StreamChatGenerics>;
};

export const PollOptionVotesList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  option,
}: PollOptionVotesListingProps<StreamChatGenerics>) => {
  const paginationParams = useMemo<PollOptionVotesQueryParams>(
    () => ({ filter: { option_id: option.id } }),
    [option.id],
  );
  const {
    error,
    hasNextPage,
    loading,
    loadMore,
    votes,
  } = usePollOptionVotesPagination<StreamChatGenerics>({
    paginationParams,
  });

  useEffect(() => {
    if (votes.length) return;
    loadMore();
  }, [loadMore, votes]);

  return (
    <div className='str-chat__poll-option str-chat__poll-option--full-vote-list'>
      <PollOptionWithVotesHeader option={option} />
      <InfiniteScrollPaginator loadNextOnScrollToBottom={loadMore} threshold={40}>
        <PollVoteListing votes={votes} />
        {hasNextPage && (
          <div className='str-chat__loading-indicator-placeholder'>
            {loading && <LoadingIndicator />}
          </div>
        )}
      </InfiniteScrollPaginator>
      {error && error.message}
    </div>
  );
};
