import clsx from 'clsx';
import React from 'react';
import { PollActions as DefaultPollActions } from './PollActions';
import { PollHeader } from './PollHeader';
import { PollOptionList } from './PollOptionList';
import { MAX_OPTIONS_DISPLAYED } from './constants';
import { useStateStore } from '../../store';
import { PollProvider, useComponentContext, usePollContext } from '../../context';
import type { Poll as PollClass, PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

type PollStateSelectorQuotedPollReturnValue = { is_closed: boolean | undefined; name: string };

const pollStateSelectorQuotedPoll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorQuotedPollReturnValue => ({
  is_closed: nextValue.is_closed,
  name: nextValue.name,
});

export const QuotedPoll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { poll } = usePollContext<StreamChatGenerics>();
  const { is_closed, name } = useStateStore(poll.state, pollStateSelectorQuotedPoll);

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

type PollStateSelectorPollUIReturnValue = { is_closed: boolean | undefined };
const pollStateSelectorPollUI = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorPollUIReturnValue => ({ is_closed: nextValue.is_closed });

const PollUI = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { PollActions = DefaultPollActions } = useComponentContext<StreamChatGenerics>();
  const { poll } = usePollContext<StreamChatGenerics>();
  const { is_closed } = useStateStore(poll.state, pollStateSelectorPollUI);

  return (
    <div className={clsx('str-chat__poll', { 'str-chat__poll--closed': is_closed })}>
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
