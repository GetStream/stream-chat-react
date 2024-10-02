import React from 'react';
import { PollResponse } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';
import clsx from 'clsx';

export type QuotedPollProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  poll: PollResponse<StreamChatGenerics>;
};

export const QuotedPoll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  poll,
}: QuotedPollProps<StreamChatGenerics>) => (
  <div
    className={clsx('str-chat__quoted-poll-preview', {
      'str-chat__quoted-poll-preview--closed': poll.is_closed,
    })}
  >
    <div className='str-chat__quoted-poll-preview__icon'>📊</div>
    <div className='str-chat__quoted-poll-preview__name'>{poll.name}</div>
  </div>
);
