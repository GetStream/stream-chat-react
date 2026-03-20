import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { PollAction } from './PollActions/PollAction';
import { PollOptionSelector as DefaultPollOptionSelector } from './PollOptionSelector';
import { useStateStore } from '../../store';
import {
  useComponentContext,
  usePollContext,
  useTranslationContext,
} from '../../context';
import type { PollOption, PollState } from 'stream-chat';
import { PollOptionsFullList as DefaultPollOptionsFullList } from './PollActions/PollOptionsFullList';

type PollStateSelectorReturnValue = { options: PollOption[] };

const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  options: nextValue.options,
});

export type PollOptionListProps = {
  optionsDisplayCount?: number;
  PollOptionsFullList?: React.ComponentType;
};

export const PollOptionList = ({
  optionsDisplayCount,
  PollOptionsFullList = DefaultPollOptionsFullList,
}: PollOptionListProps) => {
  const { PollOptionSelector = DefaultPollOptionSelector } = useComponentContext();
  const { t } = useTranslationContext('PollOptionList');
  const { poll } = usePollContext();
  const { options } = useStateStore(poll.state, pollStateSelector);
  const [viewAllOptionsOpen, setViewAllOptionsOpen] = useState(false);
  const closeViewAllOptions = useCallback(() => setViewAllOptionsOpen(false), []);
  const openViewAllOptions = useCallback(() => setViewAllOptionsOpen(true), []);

  const showMoreOptionsButton =
    typeof optionsDisplayCount === 'number' && options.length > optionsDisplayCount;

  return (
    <>
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
      {showMoreOptionsButton && (
        <PollAction
          buttonText={t('+{{count}} more options', {
            count: options.length,
          })}
          closeModal={closeViewAllOptions}
          isAdditionalAction
          modalClassName='str-chat__poll-action-modal'
          modalIsOpen={viewAllOptionsOpen}
          openModal={openViewAllOptions}
        >
          <PollOptionsFullList />
        </PollAction>
      )}
    </>
  );
};
