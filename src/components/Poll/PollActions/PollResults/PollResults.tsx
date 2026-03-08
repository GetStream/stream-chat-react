import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { PollOptionWithVotes } from './PollOptionWithVotes';
import { Viewer } from '../../../Dialog';
import { useStateStore } from '../../../../store';
import { usePollContext, useTranslationContext } from '../../../../context';
import type { PollOption, PollState } from 'stream-chat';
import { COUNT_OPTION_VOTES_PREVIEW } from '../../constants';

const pollStateSelector = ({
  name,
  options,
  vote_count,
  vote_counts_by_option,
}: PollState) => ({
  name,
  options: [...options],
  vote_count,
  vote_counts_by_option,
});

export type PollResultsProps = {
  close?: () => void;
};

export const PollResults = ({ close }: PollResultsProps) => {
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { name, options, vote_count, vote_counts_by_option } = useStateStore(
    poll.state,
    pollStateSelector,
  );
  const [optionToView, setOptionToView] = useState<{
    option: PollOption;
    optionOrderNumber: number;
  } | null>(null);

  const goBack = useCallback(() => setOptionToView(null), []);

  return (
    <Viewer.Root
      className={clsx('str-chat__modal__poll-results', {
        'str-chat__modal__poll-results--option-detail': optionToView,
      })}
    >
      {optionToView?.option ? (
        <>
          <Viewer.Header close={close} goBack={goBack} title={t('Votes')} />
          <Viewer.Body className='str-chat__modal__poll-results__body'>
            <div className='str-chat__modal__poll-results__option-detail'>
              <PollOptionWithVotes
                option={optionToView?.option}
                orderNumber={optionToView?.optionOrderNumber}
              />
            </div>
          </Viewer.Body>
        </>
      ) : (
        <>
          <Viewer.Header close={close} title={t('Poll results')} />
          <Viewer.Body className='str-chat__modal__poll-results__body'>
            <div className='str-chat__modal__poll-results__question'>
              <div className='str-chat__modal__poll-results__question__label'>
                {t('Question')}
              </div>
              <div className='str-chat__modal__poll-results__question__text'>{name}</div>
            </div>
            <div className='str-chat__modal__poll-results__options'>
              <div className='str-chat__modal__poll-results__option-list'>
                {options
                  .sort((next, current) =>
                    (vote_counts_by_option[current.id] ?? 0) >=
                    (vote_counts_by_option[next.id] ?? 0)
                      ? 1
                      : -1,
                  )
                  .map((option, i) => {
                    const optionOrderNumber = i + 1;
                    return (
                      <PollOptionWithVotes
                        countVotesPreview={COUNT_OPTION_VOTES_PREVIEW}
                        key={`poll-option-${option.id}`}
                        option={option}
                        orderNumber={optionOrderNumber}
                        showAllVotes={() =>
                          setOptionToView({ option, optionOrderNumber })
                        }
                      />
                    );
                  })}
              </div>
              <div className='str-chat__modal__poll-results__options__footer'>
                <div className='str-chat__modal__poll-results__options-total-count'>
                  {t('totalVoteCount', { count: vote_count })}
                </div>
              </div>
            </div>
          </Viewer.Body>
        </>
      )}
    </Viewer.Root>
  );
};
