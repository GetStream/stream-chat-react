import clsx from 'clsx';
import React from 'react';
import { PollHeader as DefaultPollHeader } from './PollHeader';
import { PollActions as DefaultPollActions } from './PollActions';
import { PollOptionList } from './PollOptionList';
import { MAX_OPTIONS_DISPLAYED } from './constants';
import { useComponentContext, usePollContext } from '../../context';
import { useStateStore } from '../../store';
import type { PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

type PollStateSelectorPollContentReturnValue = { is_closed: boolean | undefined };
const pollStateSelectorPollContent = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorPollContentReturnValue => ({ is_closed: nextValue.is_closed });
export const PollContent = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const {
    PollHeader = DefaultPollHeader,
    PollActions = DefaultPollActions,
  } = useComponentContext<StreamChatGenerics>();
  const { poll } = usePollContext<StreamChatGenerics>();
  const { is_closed } = useStateStore(poll.state, pollStateSelectorPollContent);

  return (
    <div className={clsx('str-chat__poll', { 'str-chat__poll--closed': is_closed })}>
      <PollHeader />
      <PollOptionList optionsDisplayCount={MAX_OPTIONS_DISPLAYED} />
      <PollActions />
    </div>
  );
};
