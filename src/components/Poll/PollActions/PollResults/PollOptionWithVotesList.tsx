import React, { useMemo } from 'react';
import { PollVoteListing } from '../../PollVote';
import { usePollOptionVotesPagination } from '../../hooks';
import {
  ListLoadErrorUI as DefaultListLoadErrorUI,
  ListLoadingNextPageUI as DefaultListLoadingNextPageUI,
} from '../../../ListStates';
import { useComponentContext } from '../../../../context';
import { InfiniteScrollPaginator } from '../../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import type { PollOptionResponseData, PollOptionVotesQueryParams } from 'stream-chat';
import { PollOptionWithVotesHeader } from './PollOptionWithVotesHeader';

export type PollOptionWithVotesListProps = {
  option: PollOptionResponseData;
  optionOrderNumber: number;
};

export const PollOptionWithVotesList = ({
  option,
  optionOrderNumber,
}: PollOptionWithVotesListProps) => {
  const {
    ListLoadErrorUI = DefaultListLoadErrorUI,
    ListLoadingNextPageUI = DefaultListLoadingNextPageUI,
  } = useComponentContext();
  const paginationParams = useMemo<PollOptionVotesQueryParams>(
    () => ({ filter: { option_id: option.id } }),
    [option.id],
  );
  const { firstPageLoadRetry, hasNextPage, loading, loadMore, votes } =
    usePollOptionVotesPagination({
      paginationParams,
    });

  return (
    // The error sits inside the scroll root, which reads as scrolled to the bottom: loading pages
    // from there would query the failed first page again on every resize.
    <InfiniteScrollPaginator
      loadNextOnScrollToBottom={firstPageLoadRetry.error ? undefined : loadMore}
      threshold={40}
    >
      <div className='str-chat_poll-option-with-votes-list'>
        <div className='str-chat__poll-option'>
          <div className='str-chat__poll-option__votes-paginated-list'>
            <PollOptionWithVotesHeader
              option={option}
              optionOrderNumber={optionOrderNumber}
            />
            {firstPageLoadRetry.error ? (
              <ListLoadErrorUI
                error={firstPageLoadRetry.error}
                isRetrying={firstPageLoadRetry.isRetrying}
                retry={firstPageLoadRetry.retry}
              />
            ) : (
              <>
                <PollVoteListing votes={votes} />
                {hasNextPage && (
                  <div className='str-chat__loading-indicator-placeholder'>
                    <ListLoadingNextPageUI isLoading={loading} position='bottom' />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </InfiniteScrollPaginator>
  );
};
