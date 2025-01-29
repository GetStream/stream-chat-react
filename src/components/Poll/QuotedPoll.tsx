import clsx from 'clsx';
import React from 'react';
import { usePollContext } from '../../context';
import { useStateStore } from '../../store';
import type { PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

type PollStateSelectorQuotedPollReturnValue = {
  is_closed: boolean | undefined;
  name: string;
};
const pollStateSelectorQuotedPoll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorQuotedPollReturnValue => ({
  is_closed: nextValue.is_closed,
  name: nextValue.name,
});

export const QuotedPoll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
