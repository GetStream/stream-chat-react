import React from 'react';
import { ModalHeader } from '../../Modal/ModalHeader';
import { PollVote } from '../PollVote';
import { usePollAnswerPagination } from '../hooks';
import { InfiniteScrollPaginator } from '../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { LoadingIndicator } from '../../Loading';
import { useTranslationContext } from '../../../context';
import type { DefaultStreamChatGenerics } from '../../../types';

export type PollAnswerListProps = {
  onUpdateOwnAnswerClick: () => void;
  ownAnswerExists: boolean;
  close?: () => void;
};

export const PollAnswerList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  close,
  onUpdateOwnAnswerClick,
  ownAnswerExists,
}: PollAnswerListProps) => {
  const { t } = useTranslationContext();
  const {
    answers,
    error,
    hasNextPage,
    loading,
    loadMore,
  } = usePollAnswerPagination<StreamChatGenerics>();

  return (
    <div className='str-chat__modal__poll-answer-list'>
      <ModalHeader close={close} title={t<string>('Poll comments')} />
      <div className='str-chat__modal__poll-answer-list__body'>
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
      </div>
      {answers.length > 0 && (
        <button className='str-chat__poll-action' onClick={onUpdateOwnAnswerClick}>
          {ownAnswerExists ? t<string>('Update your comment') : t<string>('Add a comment')}
        </button>
      )}
    </div>
  );
};
