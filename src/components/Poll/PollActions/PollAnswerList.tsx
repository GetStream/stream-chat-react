import React from 'react';
import { Prompt } from '../../Dialog';
import { PollVote } from '../PollVote';
import { usePollAnswerPagination } from '../hooks';
import { InfiniteScrollPaginator } from '../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { LoadingIndicator } from '../../Loading';
import { useStateStore } from '../../../store';
import { usePollContext, useTranslationContext } from '../../../context';

import type { PollAnswer, PollState } from 'stream-chat';

type PollStateSelectorReturnValue = {
  is_closed: boolean | undefined;
  ownAnswer: PollAnswer | undefined;
};
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  is_closed: nextValue.is_closed,
  ownAnswer: nextValue.ownAnswer,
});

export type PollAnswerListProps = {
  onUpdateOwnAnswerClick: () => void;
  close?: () => void;
};

export const PollAnswerList = ({
  close,
  onUpdateOwnAnswerClick,
}: PollAnswerListProps) => {
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { is_closed, ownAnswer } = useStateStore(poll.state, pollStateSelector);

  const { answers, error, hasNextPage, loading, loadMore } = usePollAnswerPagination();

  return (
    <Prompt.Root className='str-chat__modal__poll-answer-list'>
      <Prompt.Header close={close} title={t('Poll comments')} />
      <Prompt.Body className='str-chat__modal__poll-answer-list__body'>
        <InfiniteScrollPaginator loadNextOnScrollToBottom={loadMore} threshold={40}>
          <div className='str-chat__poll-answer-list'>
            {answers.map((answer) => (
              <div className='str-chat__poll-answer' key={`comment-${answer.id}`}>
                {answer.answer_text && (
                  <p className='str-chat__poll-answer__text'>{answer.answer_text}</p>
                )}
                <PollVote key={`poll-vote-${answer.id}`} vote={answer} />
              </div>
            ))}
          </div>
          {hasNextPage && (
            <div className='str-chat__loading-indicator-placeholder'>
              {loading && <LoadingIndicator />}
            </div>
          )}
        </InfiniteScrollPaginator>
        {error?.message && <div>{error?.message}</div>}
      </Prompt.Body>
      <Prompt.Footer>
        {answers.length > 0 && !is_closed && (
          <Prompt.FooterControls>
            <Prompt.FooterControlsButtonSecondary
              className='str-chat__poll-action'
              onClick={onUpdateOwnAnswerClick}
            >
              {ownAnswer ? t('Update your comment') : t('Add a comment')}
            </Prompt.FooterControlsButtonSecondary>
          </Prompt.FooterControls>
        )}
      </Prompt.Footer>
    </Prompt.Root>
  );
};
