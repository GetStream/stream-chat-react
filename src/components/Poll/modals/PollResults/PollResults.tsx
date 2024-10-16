import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { ModalHeader } from '../../../Modal/ModalHeader';
import { PollOptionVotesList } from './PollOptionVotesList';
import { PollOptionWithLatestVotes } from './PollOptionWithLatestVotes';
import { usePollState } from '../../hooks';
import { useTranslationContext } from '../../../../context';
import type { PollOption, PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../../types';

type PollStateSelectorReturnValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = [string, PollOption<StreamChatGenerics>[], Record<string, number>];
const pollStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorReturnValue<StreamChatGenerics> => [
  nextValue.name,
  nextValue.options,
  nextValue.vote_counts_by_option,
];

export type PollResultsProps = {
  close?: () => void;
};

// todo: sort options by vote count
export const PollResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  close,
}: PollResultsProps) => {
  const { t } = useTranslationContext();
  const [name, options, voteCountsByOption] = usePollState<
    PollStateSelectorReturnValue<StreamChatGenerics>,
    StreamChatGenerics
  >(pollStateSelector);
  const [optionToView, setOptionToView] = useState<PollOption<StreamChatGenerics>>();

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
                .sort((current, next) =>
                  voteCountsByOption[current.id] >= voteCountsByOption[next.id] ? -1 : 1,
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
