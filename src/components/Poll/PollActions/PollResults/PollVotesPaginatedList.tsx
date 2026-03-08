import React, { useMemo } from 'react';
import { PollVoteListing } from '../../PollVote';
import { usePollOptionVotesPagination } from '../../hooks';
import { LoadingIndicator } from '../../../Loading';
import { InfiniteScrollPaginator } from '../../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import type { PollOption, PollOptionVotesQueryParams } from 'stream-chat';

export type PollOptionPaginatedVotesListProps = {
  option: PollOption;
};

export const PollVotesPaginatedList = ({ option }: PollOptionPaginatedVotesListProps) => {
  const paginationParams = useMemo<PollOptionVotesQueryParams>(
    () => ({ filter: { option_id: option.id } }),
    [option.id],
  );
  const { error, hasNextPage, loading, loadMore, votes } = usePollOptionVotesPagination({
    paginationParams,
  });

  return (
    <div className='str-chat__poll-option__votes-paginated-list'>
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
