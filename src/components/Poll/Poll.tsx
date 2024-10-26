import clsx from 'clsx';
import React from 'react';
import { PollActions } from './PollActions';
import { PollHeader } from './PollHeader';
import { PollOptionList } from './PollOptionList';
import { usePollState } from './hooks';
import { MAX_OPTIONS_DISPLAYED } from './constants';
import { PollProvider } from '../../context';
import type { Poll as PollClass, PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

type PollStateSelectorQuotedPollReturnValue = [boolean | undefined, string];

const pollStateSelectorQuotedPoll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorQuotedPollReturnValue => [nextValue.is_closed, nextValue.name];

export const QuotedPoll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const [is_closed, name] = usePollState<
    PollStateSelectorQuotedPollReturnValue,
    StreamChatGenerics
  >(pollStateSelectorQuotedPoll);

  return (
    <div
      className={clsx('str-chat__quoted-poll-preview', {
        'str-chat__quoted-poll-preview--closed': is_closed,
      })}
    >
      <div className='str-chat__quoted-poll-preview__icon'>📊</div>
      <div className='str-chat__quoted-poll-preview__name'>{name}</div>
    </div>
  );
};

type PollStateSelectorPollUIReturnValue = [boolean | undefined];
const pollStateSelectorPollUI = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorPollUIReturnValue => [nextValue.is_closed];

const PollUI = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const [isClosed] = usePollState<PollStateSelectorPollUIReturnValue, StreamChatGenerics>(
    pollStateSelectorPollUI,
  );

  return (
    <div className={clsx('str-chat__poll', { 'str-chat__poll--closed': isClosed })}>
      <PollHeader />
      <PollOptionList optionsDisplayCount={MAX_OPTIONS_DISPLAYED} />
      <PollActions />
    </div>
  );
};

export const Poll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  isQuoted,
  poll,
}: {
  poll: PollClass<StreamChatGenerics>;
  isQuoted?: boolean;
}) =>
  poll ? <PollProvider poll={poll}>{isQuoted ? <QuotedPoll /> : <PollUI />}</PollProvider> : null;
