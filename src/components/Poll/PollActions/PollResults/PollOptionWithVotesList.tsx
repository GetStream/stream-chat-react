import React, { useMemo } from 'react';
import { PollVoteListing } from '../../PollVote';
import { usePollOptionVotesPagination } from '../../hooks';
import { LoadingIndicator } from '../../../Loading';
import { InfiniteScrollPaginator } from '../../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import type { PollOption, PollOptionVotesQueryParams } from 'stream-chat';
import { PollOptionWithVotesHeader } from './PollOptionWithVotesHeader';

export type PollOptionWithVotesListProps = {
  option: PollOption;
  optionOrderNumber: number;
};

export const PollOptionWithVotesList = ({
  option,
  optionOrderNumber,
}: PollOptionWithVotesListProps) => {
  const paginationParams = useMemo<PollOptionVotesQueryParams>(
    () => ({ filter: { option_id: option.id } }),
    [option.id],
  );
  const { hasNextPage, loading, loadMore, votes } = usePollOptionVotesPagination({
    paginationParams,
  });

  return (
    <InfiniteScrollPaginator loadNextOnScrollToBottom={loadMore} threshold={40}>
      <div className='str-chat_poll-option-with-votes-list'>
        <div className='str-chat__poll-option'>
          <div className='str-chat__poll-option__votes-paginated-list'>
            <PollOptionWithVotesHeader
              option={option}
              optionOrderNumber={optionOrderNumber}
            />
            <PollVoteListing votes={votes} />
            {hasNextPage && (
              <div className='str-chat__loading-indicator-placeholder'>
                {loading && <LoadingIndicator />}
              </div>
            )}
          </div>
        </div>
      </div>
    </InfiniteScrollPaginator>
  );
};
