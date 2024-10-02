import React from 'react';
import { ModalHeader } from './ModalHeader';
import { PollVote } from '../PollVote';
import { usePollAnswersPagination } from '../hooks';
import { InfiniteScrollPaginator } from '../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { LoadingIndicator } from '../../Loading';
import { useTranslationContext } from '../../../context';

export type PollAnswersListProps = {
  close?: () => void;
};

export const PollAnswersList = ({ close }: PollAnswersListProps) => {
  const { t } = useTranslationContext();
  const { error, hasNextPage, loading, loadMore, pollAnswers } = usePollAnswersPagination();

  return (
    <div className='str-chat__modal__poll-answer-list'>
      <ModalHeader close={close} title={t<string>('Poll comments')} />
      <div className='str-chat__modal__poll-answer-list__body'>
        <InfiniteScrollPaginator loadNextOnScrollToBottom={loadMore} threshold={40}>
          <div className='str-chat__poll-answer-list'>
            {pollAnswers.map((answer) => (
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
      </div>
    </div>
  );
};
