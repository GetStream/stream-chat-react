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

type PollStateSelectorReturnValue = {
  latest_votes_by_option: Record<string, PollVote[]>;
};

const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  latest_votes_by_option: nextValue.latest_votes_by_option,
});

export type PollOptionWithVotesProps = {
  option: PollOption;
  countVotesPreview?: number;
  showAllVotes?: () => void;
};

export const PollOptionWithLatestVotes = ({
  countVotesPreview = 5,
  option,
  showAllVotes,
}: PollOptionWithVotesProps) => {
  const { t } = useTranslationContext();
  const { channelCapabilities = {} } = useChannelStateContext(
    'PollOptionWithLatestVotes',
  );
  const { poll } = usePollContext();
  const { latest_votes_by_option } = useStateStore(poll.state, pollStateSelector);

  const votes = latest_votes_by_option && latest_votes_by_option[option.id];

  return (
    <div className='str-chat__poll-option'>
      <PollOptionWithVotesHeader option={option} />
      {votes && <PollVoteListing votes={votes.slice(0, countVotesPreview)} />}
      {channelCapabilities['query-poll-votes'] &&
        showAllVotes &&
        votes?.length > countVotesPreview && (
          <button
            className='str-chat__poll-option__show-all-votes-button'
            onClick={showAllVotes}
          >
            {t<string>('Show all')}
          </button>
        )}
    </div>
  );
};
