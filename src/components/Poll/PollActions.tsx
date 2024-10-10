import React, { PropsWithChildren, useCallback, useState } from 'react';
import { PollAnswersList } from './modals/PollAnswersList';
import { PollOptionsFullList } from './modals/PollOptionsFullList';
import { FormDialog, PromptDialog } from '../Dialog';
import { MAX_OPTIONS_DISPLAYED } from './config';
import { MAX_POLL_OPTIONS } from './constants';
import { PollResults } from './modals/PollResults/PollResults';
import { Modal } from '../Modal';
import { usePoll, usePollState } from './hooks';
import {
  useChannelStateContext,
  useChatContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';

import type { PollAnswer, PollOption, PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

type ModalName =
  | 'suggest-option'
  | 'add-comment'
  | 'view-all-options'
  | 'view-comments'
  | 'view-results'
  | 'end-vote';

type PollStateSelectorReturnValue = [
  boolean | undefined,
  boolean | undefined,
  number,
  string,
  boolean | undefined,
  PollOption[],
  PollAnswer | undefined,
];
const pollStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorReturnValue => [
  nextValue.allow_answers,
  nextValue.allow_user_suggested_options,
  nextValue.answers_count,
  nextValue.created_by_id,
  nextValue.is_closed,
  nextValue.options,
  nextValue.ownAnswer,
];

export const PollActions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { client } = useChatContext();
  const { t } = useTranslationContext('PollActions');
  const { channelCapabilities = {} } = useChannelStateContext<StreamChatGenerics>('PollActions');
  const { message } = useMessageContext('PollActions');
  const poll = usePoll<StreamChatGenerics>();
  const [
    allow_answers,
    allow_user_suggested_options,
    answers_count,
    created_by_id,
    is_closed,
    options,
    ownAnswer,
  ] = usePollState<PollStateSelectorReturnValue, StreamChatGenerics>(pollStateSelector);
  const [modalOpen, setModalOpen] = useState<ModalName | undefined>();

  const closeModal = useCallback(() => setModalOpen(undefined), []);

  return (
    <div className='str-chat__poll-actions'>
      {options.length > MAX_OPTIONS_DISPLAYED && (
        <PollAction
          buttonText={t<string>('See all options ({{count}})', {
            count: options.length,
          })}
          closeModal={closeModal}
          modalIsOpen={modalOpen === 'view-all-options'}
          openModal={() => setModalOpen('view-all-options')}
        >
          <PollOptionsFullList close={closeModal} />
        </PollAction>
      )}

      {!is_closed && allow_user_suggested_options && options.length < MAX_POLL_OPTIONS && (
        <PollAction
          buttonText={t<string>('Suggest an option')}
          closeModal={closeModal}
          modalIsOpen={modalOpen === 'suggest-option'}
          openModal={() => setModalOpen('suggest-option')}
        >
          <FormDialog<{ optionText: '' }>
            className='str-chat__prompt-dialog str-chat__modal__suggest-poll-option'
            close={closeModal}
            fields={{
              optionText: {
                element: 'input',
                props: {
                  id: 'optionText',
                  name: 'optionText',
                  required: true,
                  type: 'text',
                  value: '',
                },
              },
            }}
            onSubmit={async (value) => {
              await client.createPollOption(poll.id, { text: value.optionText });
            }}
            shouldDisableSubmitButton={(value) => !value.optionText}
            title={t<string>('Suggest an option')}
          />
        </PollAction>
      )}

      {!is_closed && allow_answers && (
        <PollAction
          buttonText={ownAnswer ? t<string>('Update your comment') : t<string>('Add a comment')}
          closeModal={closeModal}
          modalIsOpen={modalOpen === 'add-comment'}
          openModal={() => setModalOpen('add-comment')}
        >
          <FormDialog<{ comment: '' }>
            className='str-chat__prompt-dialog str-chat__modal__poll-add-comment'
            close={closeModal}
            fields={{
              comment: {
                element: 'input',
                props: {
                  id: 'comment',
                  name: 'comment',
                  required: true,
                  type: 'text',
                  value: ownAnswer?.answer_text ?? '',
                },
              },
            }}
            onSubmit={async (value) => {
              await poll.addAnswer(value.comment, message.id);
            }}
            shouldDisableSubmitButton={(value) =>
              !value.comment || value.comment === ownAnswer?.answer_text
            }
            title={ownAnswer ? t<string>('Update your comment') : t<string>('Add a comment')}
          />
        </PollAction>
      )}

      {answers_count > 0 && channelCapabilities['query-poll-votes'] && (
        <PollAction
          buttonText={t<string>('View {{count}} comments', { count: answers_count })}
          closeModal={closeModal}
          modalIsOpen={modalOpen === 'view-comments'}
          openModal={() => setModalOpen('view-comments')}
        >
          <PollAnswersList close={closeModal} />
          <button className='str-chat__poll-action' onClick={() => setModalOpen('add-comment')}>
            {ownAnswer ? t<string>('Update your comment') : t<string>('Add a comment')}
          </button>
        </PollAction>
      )}

      <PollAction
        buttonText={t<string>('View results')}
        closeModal={closeModal}
        modalIsOpen={modalOpen === 'view-results'}
        openModal={() => setModalOpen('view-results')}
      >
        <PollResults close={closeModal} />
      </PollAction>

      {!is_closed && created_by_id === client.user?.id && (
        <PollAction
          buttonText={t<string>('End vote')}
          closeModal={closeModal}
          modalIsOpen={modalOpen === 'end-vote'}
          openModal={() => setModalOpen('end-vote')}
        >
          <PromptDialog
            actions={[
              {
                children: t<string>('Cancel'),
                className: 'str-chat__dialog__controls-button--cancel',
                onClick: closeModal,
              },
              {
                children: t<string>('End'),
                className:
                  '.str-chat__dialog__controls-button--submit str-chat__dialog__controls-button--end-poll',
                onClick: poll.close,
              },
            ]}
            className='str-chat__modal__end-vote'
            prompt={t<string>('Nobody will be able to vote in this poll anymore.')}
            title={t<string>('End vote')}
          />
        </PollAction>
      )}
    </div>
  );
};

export type PollActionProps = {
  buttonText: string;
  closeModal: () => void;
  modalIsOpen: boolean;
  openModal: () => void;
  modalClassName?: string;
};

const PollAction = ({
  buttonText,
  children,
  closeModal,
  modalClassName,
  modalIsOpen,
  openModal,
}: PropsWithChildren<PollActionProps>) => (
  <>
    <button className='str-chat__poll-action' onClick={openModal}>
      {buttonText}
    </button>
    <Modal className={modalClassName} onClose={closeModal} open={modalIsOpen}>
      {children}
    </Modal>
  </>
);
