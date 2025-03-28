import React from 'react';
import clsx from 'clsx';
import { FieldError } from '../../Form/FieldError';
import { useTranslationContext } from '../../../context';
import { useMessageComposer } from '../../MessageInput/hooks/messageComposer/useMessageComposer';
import { useStateStore } from '../../../store';
import type { PollComposerState } from 'stream-chat';

const pollComposerStateSelector = (state: PollComposerState) => ({
  error: state.errors.name,
  name: state.data.name,
});

export const NameField = () => {
  const { t } = useTranslationContext();
  const { pollComposer } = useMessageComposer();
  const { error, name } = useStateStore(pollComposer.state, pollComposerStateSelector);
  return (
    <div
      className={clsx(
        'str-chat__form__field str-chat__form__input-field str-chat__form__input-field--with-label',
        {
          'str-chat__form__input-field--has-error': error,
        },
      )}
    >
      <label className='str-chat__form__field-label' htmlFor='name'>
        {t<string>('Question')}
      </label>
      <div className={clsx('str-chat__form__input-field__value')}>
        <FieldError
          className='str-chat__form__input-field__error'
          data-testid={'poll-name-input-field-error'}
          text={error && t(error)}
        />
        <input
          id='name'
          onBlur={() => {
            pollComposer.handleFieldBlur('name');
          }}
          onChange={(e) => {
            pollComposer.updateFields({ name: e.target.value });
          }}
          placeholder={t<string>('Ask a question')}
          type='text'
          value={name}
        />
      </div>
    </div>
  );
};
