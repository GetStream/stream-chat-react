import React from 'react';
import { PollOptionWithVotesHeader } from './PollOptionWithVotesHeader';
import { PollVoteListing } from '../../PollVote';
import { useStateStore } from '../../../../store';
import {
  useChannelStateContext,
  usePollContext,
  useTranslationContext,
} from '../../../../context';
import type { PollOption, PollState, PollVote } from 'stream-chat';
import { Button } from '../../../Button';
import clsx from 'clsx';
import { PollVotesPaginatedList } from './PollVotesPaginatedList';

type PollStateSelectorReturnValue = {
  latest_votes_by_option: Record<string, PollVote[]>;
};

const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  latest_votes_by_option: nextValue.latest_votes_by_option,
});

export type PollOptionWithVotesProps = {
  option: PollOption;
  orderNumber: number;
  countVotesPreview?: number;
  showAllVotes?: () => void;
};

export const PollOptionWithVotes = ({
  countVotesPreview,
  option,
  orderNumber,
  showAllVotes,
}: PollOptionWithVotesProps) => {
  const { t } = useTranslationContext();
  const { channelCapabilities = {} } = useChannelStateContext('PollOptionWithVotes');
  const { poll } = usePollContext();
  const { latest_votes_by_option } = useStateStore(poll.state, pollStateSelector);

  const votes = latest_votes_by_option && latest_votes_by_option[option.id];
  const voteCount = votes?.length ?? 0;
  const isVotesPreview = typeof countVotesPreview === 'number';

  return (
    <div
      className={clsx('str-chat__poll-option', {
        'str-chat__poll-option--has-more-votes':
          isVotesPreview && voteCount > countVotesPreview,
      })}
    >
      <PollOptionWithVotesHeader option={option} optionOrderNumber={orderNumber} />
      {!votes ? null : isVotesPreview ? (
        <PollVoteListing votes={votes.slice(0, countVotesPreview)} />
      ) : (
        <PollVotesPaginatedList option={option} />
      )}
      {channelCapabilities['query-poll-votes'] &&
        showAllVotes &&
        isVotesPreview &&
        votes?.length > countVotesPreview && (
          <div className='str-chat__poll-option__show-all-votes-button-container'>
            <Button
              appearance='ghost'
              className='str-chat__poll-option__show-all-votes-button'
              onClick={showAllVotes}
              size='md'
              variant='secondary'
            >
              {t('View all')}
            </Button>
          </div>
        )}
    </div>
  );
};
