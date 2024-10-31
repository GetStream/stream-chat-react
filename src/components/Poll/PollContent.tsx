import type { DefaultStreamChatGenerics } from '../../types';
import type { PollState } from '../../../../stream-chat-js';
import { PollHeader as DefaulPollHeader } from './PollHeader';
import { PollActions as DefaultPollActions } from './PollActions';
import { useComponentContext, usePollContext } from '../../context';
import { useStateStore } from '../../store';
import clsx from 'clsx';
import { PollOptionList } from './PollOptionList';
import { MAX_OPTIONS_DISPLAYED } from './constants';
import React from 'react';

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
    PollHeader = DefaulPollHeader,
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
