import clsx from 'clsx';
import React from 'react';
import { SimpleSwitchField } from '../../Form/SwitchField';
import { FieldError } from '../../Form/FieldError';
import { useTranslationContext } from '../../../context';
import { useMessageComposer } from '../../MessageInput';
import { useStateStore } from '../../../store';
import type { PollComposerState } from 'stream-chat';

const pollComposerStateSelector = (state: PollComposerState) => ({
  enforce_unique_vote: state.data.enforce_unique_vote,
  error: state.errors.max_votes_allowed,
  max_votes_allowed: state.data.max_votes_allowed,
});

export const MultipleAnswersField = () => {
  const { t } = useTranslationContext();
  const { pollComposer } = useMessageComposer();
  const { enforce_unique_vote, error, max_votes_allowed } = useStateStore(
    pollComposer.state,
    pollComposerStateSelector,
  );
  return (
    <div
      className={clsx('str-chat__form__expandable-field', {
        'str-chat__form__expandable-field--expanded': !enforce_unique_vote,
      })}
    >
      <SimpleSwitchField
        checked={!enforce_unique_vote}
        id='enforce_unique_vote'
        labelText={t('Multiple answers')}
        onChange={(e) => {
          pollComposer.updateFields({ enforce_unique_vote: !e.target.checked });
        }}
      />
      {!enforce_unique_vote && (
        <div
          className={clsx('str-chat__form__input-field', {
            'str-chat__form__input-field--has-error': error,
          })}
        >
          <div className={clsx('str-chat__form__input-field__value')}>
            <FieldError
              className='str-chat__form__input-field__error'
              data-testid={'poll-max-votes-allowed-input-field-error'}
              text={error && t(error)}
            />
            <input
              id='max_votes_allowed'
              onBlur={() => {
                pollComposer.handleFieldBlur('max_votes_allowed');
              }}
              onChange={(e) => {
                const nativeFieldValidation = !e.target.validity.valid
                  ? {
                      max_votes_allowed: t('Only numbers are allowed'),
                    }
                  : undefined;
                pollComposer.updateFields(
                  {
                    max_votes_allowed: !nativeFieldValidation
                      ? e.target.value
                      : pollComposer.max_votes_allowed,
                  },
                  nativeFieldValidation,
                );
              }}
              placeholder={t('Maximum number of votes (from 2 to 10)')}
              type='text'
              value={max_votes_allowed}
            />
          </div>
        </div>
      )}
    </div>
  );
};
