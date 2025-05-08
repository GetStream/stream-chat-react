import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { PollOptionVotesList } from './PollOptionVotesList';
import { PollOptionWithLatestVotes } from './PollOptionWithLatestVotes';
import { ModalHeader } from '../../../Modal/ModalHeader';
import { useStateStore } from '../../../../store';
import { usePollContext, useTranslationContext } from '../../../../context';
import type { PollOption, PollState } from 'stream-chat';

type PollStateSelectorReturnValue = {
  name: string;
  options: PollOption[];
  vote_counts_by_option: Record<string, number>;
};
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  name: nextValue.name,
  options: [...nextValue.options],
  vote_counts_by_option: nextValue.vote_counts_by_option,
});

export type PollResultsProps = {
  close?: () => void;
};

export const PollResults = ({ close }: PollResultsProps) => {
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { name, options, vote_counts_by_option } = useStateStore(
    poll.state,
    pollStateSelector,
  );
  const [optionToView, setOptionToView] = useState<PollOption>();

  const goBack = useCallback(() => setOptionToView(undefined), []);

  return (
    <div
      className={clsx('str-chat__modal__poll-results', {
        'str-chat__modal__poll-results--option-detail': optionToView,
      })}
    >
      {optionToView ? (
        <>
          <ModalHeader close={close} goBack={goBack} title={optionToView.text} />
          <div className='str-chat__modal__poll-results__body'>
            <PollOptionVotesList
              key={`poll-option-detail-${optionToView.id}`}
              option={optionToView}
            />
          </div>
        </>
      ) : (
        <>
          <ModalHeader close={close} title={t<string>('Poll results')} />
          <div className='str-chat__modal__poll-results__body'>
            <div className='str-chat__modal__poll-results__title'>{name}</div>
            <div className='str-chat__modal__poll-results__option-list'>
              {options
                .sort((next, current) =>
                  (vote_counts_by_option[current.id] ?? 0) >=
                  (vote_counts_by_option[next.id] ?? 0)
                    ? 1
                    : -1,
                )
                .map((option) => (
                  <PollOptionWithLatestVotes
                    key={`poll-option-${option.id}`}
                    option={option}
                    showAllVotes={() => setOptionToView(option)}
                  />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
