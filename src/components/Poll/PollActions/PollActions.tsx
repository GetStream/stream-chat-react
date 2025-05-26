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

import type { PollAnswer, PollOption, PollState } from 'stream-chat';

type ModalName =
  | 'suggest-option'
  | 'add-comment'
  | 'view-all-options'
  | 'view-comments'
  | 'view-results'
  | 'end-vote';

type PollStateSelectorReturnValue = {
  allow_answers: boolean | undefined;
  allow_user_suggested_options: boolean | undefined;
  answers_count: number;
  created_by_id: string;
  is_closed: boolean | undefined;
  options: PollOption[];
  ownAnswer: PollAnswer | undefined;
};
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  allow_answers: nextValue.allow_answers,
  allow_user_suggested_options: nextValue.allow_user_suggested_options,
  answers_count: nextValue.answers_count,
  created_by_id: nextValue.created_by_id,
  is_closed: nextValue.is_closed,
  options: nextValue.options,
  ownAnswer: nextValue.ownAnswer,
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
  } = useStateStore(poll.state, pollStateSelector);
  const [modalOpen, setModalOpen] = useState<ModalName | undefined>();

  const closeModal = useCallback(() => setModalOpen(undefined), []);
  const onUpdateAnswerClick = useCallback(() => setModalOpen('add-comment'), []);

  return (
    <div className='str-chat__poll-actions'>
      {options.length > MAX_OPTIONS_DISPLAYED && (
        <PollAction
          buttonText={t('See all options ({{count}})', {
            count: options.length,
          })}
          closeModal={closeModal}
          modalIsOpen={modalOpen === 'view-all-options'}
          openModal={() => setModalOpen('view-all-options')}
        >
          <PollOptionsFullList close={closeModal} />
        </PollAction>
      )}

      {!is_closed &&
        allow_user_suggested_options &&
        options.length < MAX_POLL_OPTIONS && (
          <PollAction
            buttonText={t('Suggest an option')}
            closeModal={closeModal}
            modalClassName='str-chat__suggest-poll-option-modal'
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
          modalClassName='str-chat__add-poll-answer-modal'
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
          modalClassName='str-chat__poll-answer-list-modal'
          modalIsOpen={modalOpen === 'view-comments'}
          openModal={() => setModalOpen('view-comments')}
        >
          <PollAnswerList
            close={closeModal}
            onUpdateOwnAnswerClick={onUpdateAnswerClick}
          />
        </PollAction>
      )}

      <PollAction
        buttonText={t('View results')}
        closeModal={closeModal}
        modalClassName='str-chat__poll-results-modal'
        modalIsOpen={modalOpen === 'view-results'}
        openModal={() => setModalOpen('view-results')}
      >
        <PollResults close={closeModal} />
      </PollAction>

      {!is_closed && created_by_id === client.user?.id && (
        <PollAction
          buttonText={t('End vote')}
          closeModal={closeModal}
          modalClassName='str-chat__end-poll-modal'
          modalIsOpen={modalOpen === 'end-vote'}
          openModal={() => setModalOpen('end-vote')}
        >
          <EndPollDialog close={closeModal} />
        </PollAction>
      )}
    </div>
  );
};
