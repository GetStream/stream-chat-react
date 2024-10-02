import clsx from 'clsx';
import React from 'react';
import { PollOptionSelector } from './PollOptionSelector';
import { usePollState } from './hooks';
import type { PollOption, PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

type PollStateSelectorReturnValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = [PollOption<StreamChatGenerics>[]];
const pollStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorReturnValue<StreamChatGenerics> => [nextValue.options];

export type PollOptionListProps = {
  optionsDisplayCount?: number;
};

export const PollOptionList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  optionsDisplayCount,
}: PollOptionListProps) => {
  const [options] = usePollState<PollStateSelectorReturnValue, StreamChatGenerics>(
    pollStateSelector,
  );

  return (
    <div
      className={clsx('str-chat__poll-option-list', {
        'str-chat__poll-option-list--full': typeof optionsDisplayCount === 'undefined',
      })}
    >
      {options.slice(0, optionsDisplayCount ?? options.length).map((option) => (
        <PollOptionSelector avatarCount={3} key={`poll-option-${option.id}`} option={option} />
      ))}
    </div>
  );
};
