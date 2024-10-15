import clsx from 'clsx';
import React from 'react';
import { PollActions } from './PollActions';
import { PollHeader } from './PollHeader';
import { PollOptionList } from './PollOptionList';
import { MAX_OPTIONS_DISPLAYED } from './config';
import { usePollState } from './hooks';
import { PollProvider } from '../../context';
import type { Poll as PollClass, PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

type PollStateSelectorReturnValue = [boolean | undefined];
const pollStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorReturnValue => [nextValue.is_closed];

const PollUI = () => {
  const [isClosed] = usePollState(pollStateSelector);

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
  poll,
}: {
  poll: PollClass<StreamChatGenerics>;
}) =>
  poll ? (
    <PollProvider poll={poll}>
      <PollUI />
    </PollProvider>
  ) : null;
