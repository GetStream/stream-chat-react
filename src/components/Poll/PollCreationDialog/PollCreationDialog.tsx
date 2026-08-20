import React, { useEffect } from 'react';
import type { PollComposerState } from 'stream-chat';
import { MultipleAnswersField } from './MultipleAnswersField';
import { NameField } from './NameField';
import { OptionFieldSet } from './OptionFieldSet';
import { PollCreationDialogControls } from './PollCreationDialogControls';
import { Prompt } from '../../Dialog';
import { SwitchField } from '../../Form/SwitchField';
import { useInteractionAnnouncements } from '../../Accessibility';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
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
  const { announceInteraction } = useInteractionAnnouncements();
  const { pollComposer } = useMessageComposerController();
  const { allow_answers, allow_user_suggested_options, voting_visibility } =
    useStateStore(pollComposer.state, pollComposerStateSelector);

  useEffect(() => {
    announceInteraction('poll.dialogOpened');
  }, [announceInteraction]);

  return (
    <Prompt.Root
      className='str-chat__poll-creation-dialog'
      data-testid='poll-creation-dialog'
    >
      <Prompt.Header
        close={close}
        description={t(
          'common.createQuestionAddOptions.label',
          'Create a question, add options, and configure poll settings',
        )}
        title={t('poll.creationDialog.createPoll.title', 'Create Poll')}
      />
      <Prompt.Body>
        <form autoComplete='off'>
          <NameField />
          <OptionFieldSet />
          <div className='str-chat__poll-creation-dialog__features-selectors'>
            <MultipleAnswersField />
            <SwitchField
              checked={voting_visibility === 'anonymous'}
              description={t(
                'poll.creationDialog.hideWhoVoted.description',
                'Hide Who Voted',
              )}
              id='voting_visibility'
              onChange={(e) =>
                pollComposer.updateFields({
                  voting_visibility: e.target.checked ? 'anonymous' : 'public',
                })
              }
              title={t('poll.creationDialog.anonymousPoll.title', 'Anonymous Poll')}
            />
            <SwitchField
              checked={allow_user_suggested_options}
              description={t(
                'poll.creationDialog.letOthersAddOptions.description',
                'Let Others Add Options',
              )}
              id='allow_user_suggested_options'
              onChange={(e) =>
                pollComposer.updateFields({
                  allow_user_suggested_options: e.target.checked,
                })
              }
              title={t('poll.actions.suggestOption.label', 'Suggest an Option')}
            />
            <SwitchField
              checked={allow_answers}
              description={t(
                'poll.creationDialog.allowOthersAddComments.description',
                'Allow Others to Add Comments',
              )}
              id='allow_answers'
              onChange={(e) =>
                pollComposer.updateFields({ allow_answers: e.target.checked })
              }
              title={t('poll.addCommentPrompt.addComment.label', 'Add a Comment')}
            />
          </div>
        </form>
      </Prompt.Body>
      <PollCreationDialogControls close={close} />
    </Prompt.Root>
  );
};
