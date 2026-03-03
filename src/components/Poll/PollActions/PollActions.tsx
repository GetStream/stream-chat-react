import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { PollAction } from './PollAction';
import type { AddCommentFormProps } from './AddCommentForm';
import { AddCommentForm as DefaultAddCommentForm } from './AddCommentForm';
import type { SuggestPollOptionFormProps } from './SuggestPollOptionForm';
import { SuggestPollOptionForm as DefaultSuggestPollOptionForm } from './SuggestPollOptionForm';
import type { EndPollDialogProps } from './EndPollDialog';
import { EndPollDialog as DefaultEndPollDialog } from './EndPollDialog';
import type { PollAnswerListProps } from './PollAnswerList';
import { PollAnswerList as DefaultPollAnswerList } from './PollAnswerList';
import type { FullPollOptionsListingProps } from './PollOptionsFullList';
import { PollOptionsFullList as DefaultPollOptionsFullList } from './PollOptionsFullList';
import type { PollResultsProps } from './PollResults';
import { PollResults as DefaultPollResults } from './PollResults';
import { MAX_OPTIONS_DISPLAYED, MAX_POLL_OPTIONS } from '../constants';
import {
  useChannelStateContext,
  useChatContext,
  useMessageContext,
  usePollContext,
  useTranslationContext,
} from '../../../context';
import { useStateStore } from '../../../store';

import type { PollState } from 'stream-chat';

const COMMON_MODAL_CLASS = 'str-chat__poll-action-modal' as const;

type ModalName =
  | 'suggest-option'
  | 'add-comment'
  | 'view-all-options'
  | 'view-comments'
  | 'view-results'
  | 'end-vote';

const pollStateSelector = (nextValue: PollState) => ({
  allow_answers: nextValue.allow_answers,
  allow_user_suggested_options: nextValue.allow_user_suggested_options,
  answers_count: nextValue.answers_count,
  created_by_id: nextValue.created_by_id,
  is_closed: nextValue.is_closed,
  options: nextValue.options,
  ownAnswer: nextValue.ownAnswer,
  voteCount: nextValue.vote_count,
});

export type PollActionsProps = {
  AddCommentForm?: React.ComponentType<AddCommentFormProps>;
  EndPollDialog?: React.ComponentType<EndPollDialogProps>;
  PollAnswerList?: React.ComponentType<PollAnswerListProps>;
  PollOptionsFullList?: React.ComponentType<FullPollOptionsListingProps>;
  PollResults?: React.ComponentType<PollResultsProps>;
  SuggestPollOptionForm?: React.ComponentType<SuggestPollOptionFormProps>;
};

export const PollActions = ({
  AddCommentForm = DefaultAddCommentForm,
  EndPollDialog = DefaultEndPollDialog,
  PollAnswerList = DefaultPollAnswerList,
  PollOptionsFullList = DefaultPollOptionsFullList,
  PollResults = DefaultPollResults,
  SuggestPollOptionForm = DefaultSuggestPollOptionForm,
}: PollActionsProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext('PollActions');
  const { channelCapabilities = {} } = useChannelStateContext('PollActions');
  const { message } = useMessageContext('PollActions');
  const { poll } = usePollContext();
  const {
    allow_answers,
    allow_user_suggested_options,
    answers_count,
    created_by_id,
    is_closed,
    options,
    ownAnswer,
    voteCount,
  } = useStateStore(poll.state, pollStateSelector);
  const [modalOpen, setModalOpen] = useState<ModalName | undefined>();

  const canCastVote = channelCapabilities['cast-poll-vote'] && !is_closed;
  const closeModal = useCallback(() => setModalOpen(undefined), []);
  const onUpdateAnswerClick = useCallback(() => setModalOpen('add-comment'), []);

  const hasContents =
    (!is_closed && created_by_id === client.user?.id) ||
    !!voteCount ||
    options.length > MAX_OPTIONS_DISPLAYED ||
    (canCastVote && allow_user_suggested_options && options.length < MAX_POLL_OPTIONS) ||
    (!is_closed && allow_answers) ||
    (answers_count > 0 && channelCapabilities['query-poll-votes']);

  if (!hasContents) return null;

  return (
    <div className='str-chat__poll-actions'>
      {!is_closed && created_by_id === client.user?.id && (
        <PollAction
          buttonText={t('End vote')}
          closeModal={closeModal}
          modalClassName={clsx(COMMON_MODAL_CLASS, 'str-chat__end-poll-modal')}
          modalIsOpen={modalOpen === 'end-vote'}
          openModal={() => setModalOpen('end-vote')}
        >
          <EndPollDialog close={closeModal} />
        </PollAction>
      )}

      {!!voteCount && (
        <PollAction
          buttonText={t('View results')}
          closeModal={closeModal}
          modalClassName={clsx(COMMON_MODAL_CLASS, 'str-chat__poll-results-modal')}
          modalIsOpen={modalOpen === 'view-results'}
          openModal={() => setModalOpen('view-results')}
        >
          <PollResults close={closeModal} />
        </PollAction>
      )}
      {options.length > MAX_OPTIONS_DISPLAYED && (
        <PollAction
          buttonText={t('See all options ({{count}})', {
            count: options.length,
          })}
          closeModal={closeModal}
          modalClassName={COMMON_MODAL_CLASS}
          modalIsOpen={modalOpen === 'view-all-options'}
          openModal={() => setModalOpen('view-all-options')}
        >
          <PollOptionsFullList close={closeModal} />
        </PollAction>
      )}

      {canCastVote &&
        allow_user_suggested_options &&
        options.length < MAX_POLL_OPTIONS && (
          <PollAction
            buttonText={t('Suggest an option')}
            closeModal={closeModal}
            isAdditionalAction
            modalClassName={clsx(
              COMMON_MODAL_CLASS,
              'str-chat__suggest-poll-option-modal',
            )}
            modalIsOpen={modalOpen === 'suggest-option'}
            openModal={() => setModalOpen('suggest-option')}
          >
            <SuggestPollOptionForm close={closeModal} messageId={message.id} />
          </PollAction>
        )}

      {!is_closed && allow_answers && (
        <PollAction
          buttonText={ownAnswer ? t('Update your comment') : t('Add a comment')}
          closeModal={closeModal}
          isAdditionalAction
          modalClassName={clsx(COMMON_MODAL_CLASS, 'str-chat__add-poll-answer-modal')}
          modalIsOpen={modalOpen === 'add-comment'}
          openModal={() => setModalOpen('add-comment')}
        >
          <AddCommentForm close={closeModal} messageId={message.id} />
        </PollAction>
      )}

      {answers_count > 0 && channelCapabilities['query-poll-votes'] && (
        <PollAction
          buttonText={t('View {{count}} comments', { count: answers_count })}
          closeModal={closeModal}
          isAdditionalAction
          modalClassName={clsx(COMMON_MODAL_CLASS, 'str-chat__poll-answer-list-modal')}
          modalIsOpen={modalOpen === 'view-comments'}
          openModal={() => setModalOpen('view-comments')}
        >
          <PollAnswerList
            close={closeModal}
            onUpdateOwnAnswerClick={onUpdateAnswerClick}
          />
        </PollAction>
      )}
    </div>
  );
};
