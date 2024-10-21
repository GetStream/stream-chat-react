import React from 'react';
import { usePollState } from '../../hooks';
import { useTranslationContext } from '../../../../context';
import type { PollOption, PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../../types';

type PollStateSelectorReturnValue = [string[], Record<string, number>];
const pollStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorReturnValue => [nextValue.maxVotedOptionIds, nextValue.vote_counts_by_option];

export type PollResultOptionVoteCounterProps = {
  optionId: string;
};

export const PollResultOptionVoteCounter = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  optionId,
}: PollResultOptionVoteCounterProps) => {
  const { t } = useTranslationContext();
  const [maxVotedOptionIds, vote_counts_by_option] = usePollState<
    PollStateSelectorReturnValue,
    StreamChatGenerics
  >(pollStateSelector);

  return (
    <div className='str-chat__poll-result-option-vote-counter'>
      {maxVotedOptionIds.length === 1 && maxVotedOptionIds[0] === optionId && (
        <div className='str-chat__poll-result-winning-option-icon' />
      )}
      <span className='str-chat__poll-result-option-vote-count'>
        {t<string>('{{count}} votes', { count: vote_counts_by_option[optionId] ?? 0 })}
      </span>
    </div>
  );
};

export type PollOptionWithVotesHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  option: PollOption<StreamChatGenerics>;
};

export const PollOptionWithVotesHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  option,
}: PollOptionWithVotesHeaderProps<StreamChatGenerics>) => (
  <div className='str-chat__poll-option__header'>
    <div className='str-chat__poll-option__option-text'>{option.text}</div>
    <PollResultOptionVoteCounter optionId={option.id} />
  </div>
);
