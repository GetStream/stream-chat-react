import clsx from 'clsx';
import debounce from 'lodash.debounce';
import React, { useMemo } from 'react';
import { isVoteAnswer } from 'stream-chat';
import { Avatar } from '../Avatar';
import {
  useChannelStateContext,
  useMessageContext,
  usePollContext,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import type { PollOption, PollState, PollVote, VotingVisibility } from 'stream-chat';

type AmountBarProps = {
  amount: number;
  className?: string;
};

export const AmountBar = ({ amount, className }: AmountBarProps) => (
  <div
    className={clsx('str-chat__amount-bar', className)}
    data-testid='amount-bar'
    role='progressbar'
    style={
      {
        '--str-chat__amount-bar-fulfillment': amount + '%',
      } as React.CSSProperties
    }
  />
);

export type CheckmarkProps = { checked?: boolean };

export const Checkmark = ({ checked }: CheckmarkProps) => (
  <div
    className={clsx('str-chat__checkmark', { 'str-chat__checkmark--checked': checked })}
  />
);

type PollStateSelectorReturnValue = {
  is_closed: boolean | undefined;
  latest_votes_by_option: Record<string, PollVote[]>;
  maxVotedOptionIds: string[];
  ownVotesByOptionId: Record<string, PollVote>;
  vote_counts_by_option: Record<string, number>;
  voting_visibility: VotingVisibility | undefined;
};
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  is_closed: nextValue.is_closed,
  latest_votes_by_option: nextValue.latest_votes_by_option,
  maxVotedOptionIds: nextValue.maxVotedOptionIds,
  ownVotesByOptionId: nextValue.ownVotesByOptionId,
  vote_counts_by_option: nextValue.vote_counts_by_option,
  voting_visibility: nextValue.voting_visibility,
});

export type PollOptionSelectorProps = {
  option: PollOption;
  displayAvatarCount?: number;
  voteCountVerbose?: boolean;
};

export const PollOptionSelector = ({
  displayAvatarCount,
  option,
  voteCountVerbose,
}: PollOptionSelectorProps) => {
  const { t } = useTranslationContext();
  const { channelCapabilities = {} } = useChannelStateContext('PollOptionsShortlist');
  const { message } = useMessageContext();

  const { poll } = usePollContext();
  const {
    is_closed,
    latest_votes_by_option,
    maxVotedOptionIds,
    ownVotesByOptionId,
    vote_counts_by_option,
    voting_visibility,
  } = useStateStore(poll.state, pollStateSelector);
  const canCastVote = channelCapabilities['cast-poll-vote'] && !is_closed;
  const winningOptionCount = maxVotedOptionIds[0]
    ? vote_counts_by_option[maxVotedOptionIds[0]]
    : 0;

  const toggleVote = useMemo(
    () =>
      debounce(() => {
        if (!canCastVote) return;
        const haveVotedForTheOption = !!ownVotesByOptionId[option.id];
        return haveVotedForTheOption
          ? poll.removeVote(ownVotesByOptionId[option.id].id, message.id)
          : poll.castVote(option.id, message.id);
      }, 100),
    [canCastVote, message.id, option.id, ownVotesByOptionId, poll],
  );

  return (
    <div
      className={clsx('str-chat__poll-option', {
        'str-chat__poll-option--votable': canCastVote,
      })}
      key={`base-poll-option-${option.id}`}
      onClick={toggleVote}
    >
      {canCastVote && <Checkmark checked={!!ownVotesByOptionId[option.id]} />}
      <div className='str-chat__poll-option-data'>
        <p className='str-chat__poll-option-text'>{option.text}</p>
        {displayAvatarCount && voting_visibility === 'public' && (
          <div className='str-chat__poll-option-voters'>
            {latest_votes_by_option?.[option.id] &&
              (latest_votes_by_option[option.id] as PollVote[])
                .filter((vote) => !!vote.user && !isVoteAnswer(vote))
                .slice(0, displayAvatarCount)
                .map(({ user }) => (
                  <Avatar
                    imageUrl={user?.image}
                    key={`poll-option-${option.id}-avatar-${user?.id}`}
                    size='md'
                    userName={user?.name}
                  />
                ))}
          </div>
        )}
        <div className='str-chat__poll-option-vote-count'>
          {voteCountVerbose
            ? t('{{count}} votes', {
                count: vote_counts_by_option[option.id] ?? 0,
              })
            : (vote_counts_by_option[option.id] ?? 0)}
        </div>
      </div>
      <AmountBar
        amount={
          (winningOptionCount &&
            (vote_counts_by_option[option.id] ?? 0) / winningOptionCount) * 100
        }
        className={clsx('str-chat__poll-option__votes-bar', {
          'str-chat__poll-option__votes-bar--winner':
            is_closed &&
            maxVotedOptionIds.length === 1 &&
            maxVotedOptionIds[0] === option.id,
        })}
      />
    </div>
  );
};
