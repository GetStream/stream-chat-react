import clsx from 'clsx';
import React from 'react';
import { isVoteAnswer } from 'stream-chat';
import { usePoll, usePollState } from './hooks';
import { Avatar } from '../Avatar';
import { useChannelStateContext, useMessageContext, useTranslationContext } from '../../context';
import type { PollOption, PollState, PollVote } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

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
  <div className={clsx('str-chat__checkmark', { 'str-chat__checkmark--checked': checked })} />
);

type PollStateSelectorReturnValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = [
  boolean | undefined,
  Record<string, PollVote<StreamChatGenerics>[]>,
  string[],
  Record<string, string>,
  number,
  Record<string, number>,
];
const pollStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorReturnValue<StreamChatGenerics> => [
  nextValue.is_closed,
  nextValue.latest_votes_by_option,
  nextValue.maxVotedOptionIds,
  nextValue.ownVotesByOptionId,
  nextValue.vote_count,
  nextValue.vote_counts_by_option,
];

export type PollOptionSelectorProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  option: PollOption<StreamChatGenerics>;
  avatarCount?: number;
  voteCountVerbose?: boolean;
};

export const PollOptionSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  avatarCount,
  option,
  voteCountVerbose,
}: PollOptionSelectorProps<StreamChatGenerics>) => {
  const { t } = useTranslationContext();
  const { channelCapabilities = {} } = useChannelStateContext<StreamChatGenerics>(
    'PollOptionsShortlist',
  );
  const { message } = useMessageContext();
  const [
    is_closed,
    latest_votes_by_option,
    maxVotedOptionIds,
    ownVotesByOptionId,
    vote_count,
    vote_counts_by_option,
  ] = usePollState<PollStateSelectorReturnValue, StreamChatGenerics>(pollStateSelector);
  const poll = usePoll();
  const canCastVote = channelCapabilities['cast-poll-vote'] && !is_closed;

  return (
    <div
      className={clsx('str-chat__poll-option', {
        'str-chat__poll-option--votable': canCastVote,
      })}
      key={`base-poll-option-${option.id}`}
      onClick={() => {
        if (!canCastVote) return;
        const haveVotedForTheOption = !!ownVotesByOptionId[option.id];
        return haveVotedForTheOption
          ? poll.removeVote(ownVotesByOptionId[option.id], message.id)
          : poll.castVote(option.id, message.id);
      }}
    >
      {!is_closed && <Checkmark checked={!!ownVotesByOptionId[option.id]} />}
      <div className='str-chat__poll-option-data'>
        <p className='str-chat__poll-option-text'>{option.text}</p>
        {avatarCount && (
          <div className='str-chat__poll-option-voters'>
            {latest_votes_by_option?.[option.id] &&
              (latest_votes_by_option[option.id] as PollVote<StreamChatGenerics>[])
                .filter((vote) => !!vote.user && !isVoteAnswer(vote))
                .slice(0, avatarCount) // todo: check how many avatars should be shown
                .map(({ user }) => (
                  <Avatar
                    image={user?.image}
                    key={`poll-option-${option.id}-avatar-${user?.id}`}
                    name={user?.name}
                  />
                ))}
          </div>
        )}
        <div className='str-chat__poll-option-vote-count'>
          {voteCountVerbose
            ? t<string>('{{count}} votes', { count: vote_counts_by_option[option.id] ?? 0 })
            : vote_counts_by_option[option.id] ?? 0}
        </div>
      </div>
      <AmountBar
        amount={(vote_count && (vote_counts_by_option[option.id] ?? 0) / vote_count) * 100}
        className={clsx('str-chat__poll-option__votes-bar', {
          'str-chat__poll-option__votes-bar--winner':
            is_closed && maxVotedOptionIds.length === 1 && maxVotedOptionIds[0] === option.id,
        })}
      />
    </div>
  );
};
