import clsx from 'clsx';
import React from 'react';
import { PollOptionSelector } from './PollOptionSelector';
import type { PollOption, PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';
import { usePollContext } from '../../context';
import { useStateStore } from '../../store';

type PollStateSelectorReturnValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = { options: PollOption<StreamChatGenerics>[] };

const pollStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorReturnValue<StreamChatGenerics> => ({ options: nextValue.options });

export type PollOptionListProps = {
  optionsDisplayCount?: number;
};

export const PollOptionList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  optionsDisplayCount,
}: PollOptionListProps) => {
  const { poll } = usePollContext<StreamChatGenerics>();
  const { options } = useStateStore(poll.state, pollStateSelector);

  return (
    <div
      className={clsx('str-chat__poll-option-list', {
        'str-chat__poll-option-list--full': typeof optionsDisplayCount === 'undefined',
      })}
    >
      {options.slice(0, optionsDisplayCount ?? options.length).map((option) => (
        <PollOptionSelector
          displayAvatarCount={3}
          key={`poll-option-${option.id}`}
          option={option}
        />
      ))}
    </div>
  );
};
