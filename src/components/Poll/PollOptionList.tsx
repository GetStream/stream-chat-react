import clsx from 'clsx';
import React from 'react';
import { PollOptionSelector as DefaultPollOptionSelector } from './PollOptionSelector';
import { useStateStore } from '../../store';
import { useComponentContext, usePollContext } from '../../context';
import type { PollOption, PollState } from 'stream-chat';

type PollStateSelectorReturnValue = { options: PollOption[] };

const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  options: nextValue.options,
});

export type PollOptionListProps = {
  optionsDisplayCount?: number;
};

export const PollOptionList = ({ optionsDisplayCount }: PollOptionListProps) => {
  const { PollOptionSelector = DefaultPollOptionSelector } = useComponentContext();
  const { poll } = usePollContext();
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
