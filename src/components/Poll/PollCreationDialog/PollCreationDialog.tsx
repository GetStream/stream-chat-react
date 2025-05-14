import clsx from 'clsx';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { FieldError } from '../../Form/FieldError';
import { OptionFieldSet } from './OptionFieldSet';
import { PollCreationDialogControls } from './PollCreationDialogControls';
import { VALID_MAX_VOTES_VALUE_REGEX } from '../constants';
import { ModalHeader } from '../../Modal/ModalHeader';
import { SimpleSwitchField } from '../../Form/SwitchField';
import { useChatContext, useTranslationContext } from '../../../context';

import type { VotingVisibility } from 'stream-chat';
import type { OptionErrors, PollFormState } from './types';

export type PollCreationDialogProps = {
  close: () => void;
};

export const PollCreationDialog = ({ close }: PollCreationDialogProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  const [nameError, setNameError] = useState<string>();
  const [optionsErrors, setOptionsErrors] = useState<OptionErrors>({});
  const [multipleAnswerCountError, setMultipleAnswerCountError] = useState<string>();
  const [state, setState] = useState<PollFormState>(
    () =>
      ({
        allow_answers: false,
        allow_user_suggested_options: false,
        description: '',
        enforce_unique_vote: true,
        id: nanoid(),
        max_votes_allowed: '',
        name: '',
        options: [{ id: nanoid(), text: '' }],
        user_id: client.user?.id,
        voting_visibility: 'public',
      }) as PollFormState,
  );

  return (
    <div
      className='str-chat__dialog str-chat__poll-creation-dialog'
      data-testid='poll-creation-dialog'
    >
      <ModalHeader close={close} title={t<string>('Create poll')} />
      <div className='str-chat__dialog__body'>
        <form autoComplete='off'>
          <div
            className={clsx(
              'str-chat__form__field str-chat__form__input-field str-chat__form__input-field--with-label',
              {
                'str-chat__form__input-field--has-error': nameError,
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
                text={nameError}
              />
              <input
                id='name'
                onBlur={(e) => {
                  if (!e.target.value) {
                    setNameError('The field is required');
                  }
                }}
                onChange={(e) => {
                  setState((prev) => ({ ...prev, name: e.target.value }));
                  if (nameError && e.target.value) {
                    setNameError(undefined);
                  }
                }}
                placeholder={t<string>('Ask a question')}
                type='text'
                value={state.name}
              />
            </div>
          </div>
          <OptionFieldSet
            errors={optionsErrors}
            options={state.options}
            setErrors={setOptionsErrors}
            setState={setState}
          />
          <div
            className={clsx('str-chat__form__expandable-field', {
              'str-chat__form__expandable-field--expanded': !state.enforce_unique_vote,
            })}
          >
            <SimpleSwitchField
              checked={!state.enforce_unique_vote}
              id='enforce_unique_vote'
              labelText={t<string>('Multiple answers')}
              onChange={(e) => {
                setState((prev) => ({
                  ...prev,
                  enforce_unique_vote: !e.target.checked,
                  max_votes_allowed: '',
                }));
                setMultipleAnswerCountError(undefined);
              }}
            />
            {!state.enforce_unique_vote && (
              <div
                className={clsx('str-chat__form__input-field', {
                  'str-chat__form__input-field--has-error': multipleAnswerCountError,
                })}
              >
                <div className={clsx('str-chat__form__input-field__value')}>
                  <FieldError
                    className='str-chat__form__input-field__error'
                    data-testid={'poll-max-votes-allowed-input-field-error'}
                    text={multipleAnswerCountError}
                  />
                  <input
                    id='max_votes_allowed'
                    onChange={(e) => {
                      const isValidValue =
                        e.target.validity.valid &&
                        (!e.target.value ||
                          e.target.value.match(VALID_MAX_VOTES_VALUE_REGEX));
                      if (!isValidValue) {
                        setMultipleAnswerCountError(
                          t<string>('Type a number from 2 to 10'),
                        );
                      } else if (multipleAnswerCountError) {
                        setMultipleAnswerCountError(undefined);
                      }
                      setState((prev) => ({
                        ...prev,
                        max_votes_allowed: e.target.value,
                      }));
                    }}
                    placeholder={t<string>('Maximum number of votes (from 2 to 10)')}
                    type='number'
                    value={state.max_votes_allowed}
                  />
                </div>
              </div>
            )}
          </div>
          <SimpleSwitchField
            checked={state.voting_visibility === 'anonymous'}
            id='voting_visibility'
            labelText={t<string>('Anonymous poll')}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                voting_visibility: (e.target.checked
                  ? 'anonymous'
                  : 'public') as VotingVisibility,
              }))
            }
          />
          <SimpleSwitchField
            checked={state.allow_user_suggested_options}
            id='allow_user_suggested_options'
            labelText={t<string>('Allow option suggestion')}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                allow_user_suggested_options: e.target.checked,
              }))
            }
          />
          <SimpleSwitchField
            checked={state.allow_answers}
            id='allow_answers'
            labelText={t<string>('Allow comments')}
            onChange={(e) =>
              setState((prev) => ({ ...prev, allow_answers: e.target.checked }))
            }
          />
        </form>
      </div>
      <PollCreationDialogControls
        close={close}
        errors={[
          ...(nameError ?? []),
          ...(multipleAnswerCountError ?? []),
          ...Object.keys(optionsErrors),
        ]}
        state={state}
      />
    </div>
  );
};
