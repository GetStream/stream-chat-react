import clsx from 'clsx';
import React from 'react';
import { PollActions as DefaultPollActions } from './PollActions';
import { PollHeader as DefaulPollHeader } from './PollHeader';
import { PollOptionList } from './PollOptionList';
import { QuotedPoll as DefaultQuotedPoll } from './QuotedPoll';
import { MAX_OPTIONS_DISPLAYED } from './constants';
import { useStateStore } from '../../store';
import { PollProvider, useComponentContext, usePollContext } from '../../context';
import type { Poll as PollClass, PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

type PollStateSelectorPollUIReturnValue = { is_closed: boolean | undefined };
const pollStateSelectorPollUI = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorPollUIReturnValue => ({ is_closed: nextValue.is_closed });

const PollUI = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const {
    PollHeader = DefaulPollHeader,
    PollActions = DefaultPollActions,
  } = useComponentContext<StreamChatGenerics>();
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
}) => {
  const { QuotedPoll = DefaultQuotedPoll } = useComponentContext();
  return poll ? (
    <PollProvider poll={poll}>{isQuoted ? <QuotedPoll /> : <PollUI />}</PollProvider>
  ) : null;
};
