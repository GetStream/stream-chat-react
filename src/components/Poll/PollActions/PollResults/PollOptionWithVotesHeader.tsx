import React from 'react';
import { useStateStore } from '../../../../store';
import { usePollContext, useTranslationContext } from '../../../../context';
import type { PollOption, PollState } from 'stream-chat';

type PollStateSelectorReturnValue = {
  maxVotedOptionIds: string[];
  vote_counts_by_option: Record<string, number>;
};
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  maxVotedOptionIds: nextValue.maxVotedOptionIds,
  vote_counts_by_option: nextValue.vote_counts_by_option,
});

export type PollResultOptionVoteCounterProps = {
  optionId: string;
};

export const PollResultOptionVoteCounter = ({
  optionId,
}: PollResultOptionVoteCounterProps) => {
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { maxVotedOptionIds, vote_counts_by_option } = useStateStore(
    poll.state,
    pollStateSelector,
  );

  return (
    <div className='str-chat__poll-result-option-vote-counter'>
      {maxVotedOptionIds.length === 1 && maxVotedOptionIds[0] === optionId && (
        <div className='str-chat__poll-result-winning-option-icon' />
      )}
      <span className='str-chat__poll-result-option-vote-count'>
        {t('{{count}} votes', { count: vote_counts_by_option[optionId] ?? 0 })}
      </span>
    </div>
  );
};

export type PollOptionWithVotesHeaderProps = {
  option: PollOption;
};

export const PollOptionWithVotesHeader = ({ option }: PollOptionWithVotesHeaderProps) => (
  <div className='str-chat__poll-option__header'>
    <div className='str-chat__poll-option__option-text'>{option.text}</div>
    <PollResultOptionVoteCounter optionId={option.id} />
  </div>
);
