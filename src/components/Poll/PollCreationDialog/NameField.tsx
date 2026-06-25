import React, { useMemo } from 'react';
import { TextInput } from '../../Form';
import { useTranslationContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useStateStore } from '../../../store';
import type { PollComposerState } from 'stream-chat';

const pollComposerStateSelector = (state: PollComposerState) => ({
  error: state.errors.name,
  name: state.data.name,
});

export const NameField = () => {
  const { t } = useTranslationContext();
  const { pollComposer } = useMessageComposerController();
  const { error, name } = useStateStore(pollComposer.state, pollComposerStateSelector);
  const knownValidationErrors = useMemo<Record<string, string>>(
    () => ({
      'Question is required': t('Question is required'),
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
            {knownValidationErrors[error] ?? t('Error')}
          </span>
        ) : undefined
      }
      id='name'
      label={t('Question')}
      onBlur={() => {
        pollComposer.handleFieldBlur('name');
      }}
      onChange={(e) => {
        pollComposer.updateFields({ name: e.target.value });
      }}
      placeholder={t('Ask a question')}
      type='text'
      value={name}
    />
  );
};
