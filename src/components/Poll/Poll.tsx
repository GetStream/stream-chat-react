import clsx from 'clsx';
import React from 'react';
import { PollActions } from './PollActions';
import { PollHeader } from './PollHeader';
import { PollOptionList } from './PollOptionList';
import { MAX_OPTIONS_DISPLAYED } from './config';
import { PollProvider } from '../../context';
import type { PollResponse } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

export const Poll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  poll,
}: {
  poll: PollResponse<StreamChatGenerics>;
}) => {
  if (!poll) return null;

  return (
    <PollProvider poll={poll}>
      <div className={clsx('str-chat__poll', { 'str-chat__poll--closed': poll.is_closed })}>
        <PollHeader />
        <PollOptionList optionsDisplayCount={MAX_OPTIONS_DISPLAYED} />
        <PollActions />
      </div>
    </PollProvider>
  );
};
