import React, { useCallback } from 'react';
import type { PollComposerState } from 'stream-chat';
import { VotingVisibility } from 'stream-chat';
import { MultipleAnswersField } from './MultipleAnswersField';
import { NameField } from './NameField';
import { OptionFieldSet } from './OptionFieldSet';
import { PollCreationDialogControls } from './PollCreationDialogControls';
import { ModalHeader } from '../../Modal/ModalHeader';
import { SwitchField } from '../../Form/SwitchField';
import { useMessageComposer } from '../../MessageInput';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

export type PollCreationDialogProps = {
  close: () => void;
};

const pollComposerStateSelector = (state: PollComposerState) => ({
  allow_answers: state.data.allow_answers,
  allow_user_suggested_options: state.data.allow_user_suggested_options,
  voting_visibility: state.data.voting_visibility,
});

export const PollCreationDialog = ({ close }: PollCreationDialogProps) => {
  const { t } = useTranslationContext();
  const { pollComposer } = useMessageComposer();
  const { allow_answers, allow_user_suggested_options, voting_visibility } =
    useStateStore(pollComposer.state, pollComposerStateSelector);

  const onClose = useCallback(() => {
    pollComposer.initState();
    close();
  }, [pollComposer, close]);

  return (
    <div
      className='str-chat__dialog str-chat__poll-creation-dialog'
      data-testid='poll-creation-dialog'
    >
      <ModalHeader close={onClose} title={t('Create poll')} />
      <div className='str-chat__dialog__body'>
        <form autoComplete='off'>
          <NameField />
          <OptionFieldSet />
          <div className='str-chat__poll-creation-dialog__features-selectors'>
            <MultipleAnswersField />
            <SwitchField
              checked={voting_visibility === 'anonymous'}
              description={t('Hide who voted')}
              id='voting_visibility'
              onChange={(e) =>
                pollComposer.updateFields({
                  voting_visibility: e.target.checked
                    ? VotingVisibility.anonymous
                    : VotingVisibility.public,
                })
              }
              title={t('Anonymous poll')}
            />
            <SwitchField
              checked={allow_user_suggested_options}
              description={t('Let others add options')}
              id='allow_user_suggested_options'
              onChange={(e) =>
                pollComposer.updateFields({
                  allow_user_suggested_options: e.target.checked,
                })
              }
              title={t('Suggest an option')}
            />
            <SwitchField
              checked={allow_answers}
              description={t('Allow others to add comments')}
              id='allow_answers'
              onChange={(e) =>
                pollComposer.updateFields({ allow_answers: e.target.checked })
              }
              title={t('Add a comment')}
            />
          </div>
        </form>
      </div>
      <PollCreationDialogControls close={close} />
    </div>
  );
};
