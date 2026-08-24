import React, { useMemo } from 'react';
import { TextInput } from '../../Form';
import { useTranslationContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useStateStore } from '../../../store';
import { POLL_COMPOSER_VALIDATION_CODE } from 'stream-chat';
import type { PollComposerState, PollComposerValidationCode } from 'stream-chat';

const pollComposerStateSelector = (state: PollComposerState) => ({
  error: state.errors.name,
  name: state.data.name,
});

export const NameField = () => {
  const { t } = useTranslationContext();
  const { pollComposer } = useMessageComposerController();
  const { error, name } = useStateStore(pollComposer.state, pollComposerStateSelector);
  // Keyed on the stable validation code rather than on the English sentence `stream-chat` produced.
  // Matching on prose meant a copy edit in the LLC silently stopped the translation from applying.
  const knownValidationErrors = useMemo<
    Partial<Record<PollComposerValidationCode, string>>
  >(
    () => ({
      [POLL_COMPOSER_VALIDATION_CODE.nameRequired]: t(
        'poll.nameField.questionRequired.label',
        'Question is required',
      ),
    }),
    [t],
  );

  return (
    // `data-autofocus` marks this as the dialog's default field. Initial focus stays on the dialog
    // surface so the SR announces the dialog identity/description; pressing Enter on the surface
    // then moves focus here (see GlobalModal's keydown handling) so the user can start typing.
    <TextInput
      className='str-chat__form__input-field__value'
      data-autofocus
      error={!!error}
      errorMessage={
        error ? (
          <span data-testid='poll-name-input-field-error'>
            {knownValidationErrors[error.code] ?? error.message}
          </span>
        ) : undefined
      }
      id='name'
      label={t('poll.question.question.text', 'Question')}
      onBlur={() => {
        pollComposer.handleFieldBlur('name');
      }}
      onChange={(e) => {
        pollComposer.updateFields({ name: e.target.value });
      }}
      placeholder={t('poll.nameField.askQuestion.placeholder', 'Ask a Question')}
      type='text'
      value={name}
    />
  );
};
