import React from 'react';
import { Button } from '../../Button';
import { Viewer } from '../../Dialog';
import { PollVote } from '../PollVote';
import { usePollAnswerPagination } from '../hooks';
import { InfiniteScrollPaginator } from '../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { LoadingIndicator } from '../../Loading';
import { useStateStore } from '../../../store';
import {
  useChatContext,
  useModalContext,
  usePollContext,
  useTranslationContext,
} from '../../../context';

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
};

export const PollAnswerList = ({ onUpdateOwnAnswerClick }: PollAnswerListProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { close } = useModalContext();
  const { is_closed } = useStateStore(poll.state, pollStateSelector);

  const { answers, error, hasNextPage, loading, loadMore } = usePollAnswerPagination();

  return (
    <Viewer.Root className='str-chat__modal__poll-answer-list'>
      <Viewer.Header close={close} title={t('Poll comments')} />
      <Viewer.Body className='str-chat__modal__poll-answer-list__body'>
        <div className='str-chat__poll-answer-list'>
          <InfiniteScrollPaginator loadNextOnScrollToBottom={loadMore} threshold={40}>
            {answers.map((answer) => (
              <div className='str-chat__poll-answer' key={`comment-${answer.id}`}>
                <div className='str-chat__poll-answer__data'>
                  {answer.answer_text && (
                    <p className='str-chat__poll-answer__text'>{answer.answer_text}</p>
                  )}
                  <PollVote key={`poll-vote-${answer.id}`} vote={answer} />
                </div>
                {!is_closed && answer.user?.id === client.user?.id && (
                  <div className='str-chat__poll-vote__update-vote-button-container'>
                    <Button
                      appearance='ghost'
                      className='str-chat__poll-vote__update-vote-button'
                      onClick={onUpdateOwnAnswerClick}
                      size='md'
                      variant='secondary'
                    >
                      {t('Update your comment')}
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {hasNextPage && (
              <div className='str-chat__loading-indicator-placeholder'>
                {loading && <LoadingIndicator />}
              </div>
            )}
          </InfiniteScrollPaginator>
        </div>
        {error?.message && <div>{error?.message}</div>}
      </Viewer.Body>
      {/*<Viewer.Footer>*/}
      {/*  {answers.length > 0 && !is_closed && (*/}
      {/*    <Viewer.FooterControls>*/}
      {/*      <Viewer.FooterControlsButtonSecondary*/}
      {/*        className='str-chat__poll-action'*/}
      {/*        onClick={onUpdateOwnAnswerClick}*/}
      {/*      >*/}
      {/*        {ownAnswer ? t('Update your comment') : t('Add a comment')}*/}
      {/*      </Viewer.FooterControlsButtonSecondary>*/}
      {/*    </Viewer.FooterControls>*/}
      {/*  )}*/}
      {/*</Viewer.Footer>*/}
    </Viewer.Root>
  );
};
