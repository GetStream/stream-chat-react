import clsx from 'clsx';
import { MAX_POLL_OPTIONS } from '../constants';
import { nanoid } from 'nanoid';
import React, { useCallback } from 'react';
import { FieldError } from '../../Form/FieldError';
import { DragAndDropContainer } from '../../DragAndDrop/DragAndDropContainer';
import { useTranslationContext } from '../../../context';
import type { OptionErrors, PollFormState, PollOptionFormData } from './types';

const VALIDATION_ERRORS = ({ 'Option already exists': true } as const) as Record<string, boolean>;

export type OptionFieldSetProps = {
  errors: OptionErrors;
  options: PollFormState['options'];
  setErrors: (fn: (prev: OptionErrors) => OptionErrors) => void;
  setState: (fn: (prev: PollFormState) => PollFormState) => void;
};

export const OptionFieldSet = ({ errors, options, setErrors, setState }: OptionFieldSetProps) => {
  const { t } = useTranslationContext('OptionFieldSet');

  const findOptionDuplicate = (sourceOption: PollOptionFormData) => {
    const isDuplicateFilter = (option: PollOptionFormData) =>
      !!sourceOption.text.trim() && // do not include empty options into consideration
      option.id !== sourceOption.id &&
      option.text.trim() === sourceOption.text.trim();

    return options.find(isDuplicateFilter);
  };

  const onSetNewOrder = useCallback(
    (newOrder: number[]) => {
      setState((prev) => ({ ...prev, options: newOrder.map((index) => prev.options[index]) }));
    },
    [setState],
  );

  const draggable = options.length > 1;

  return (
    <fieldset className='str-chat__form__field str-chat__form__input-fieldset'>
      <legend className='str-chat__form__field-label'>{t<string>('Options')}</legend>
      <DragAndDropContainer
        className='str-chat__form__input-fieldset__values'
        draggable={draggable}
        onSetNewOrder={onSetNewOrder}
      >
        {options.map((option, i) => (
          <div
            className={clsx('str-chat__form__input-field', {
              'str-chat__form__input-field--draggable': draggable,
              'str-chat__form__input-field--has-error': errors[option.id],
            })}
            key={`new-poll-option-${i}`}
          >
            <div className='str-chat__form__input-field__value'>
              <FieldError className='str-chat__form__input-field__error' text={errors[option.id]} />
              <input
                id={option.id}
                onBlur={(e) => {
                  if (findOptionDuplicate({ id: e.target.id, text: e.target.value })) {
                    setErrors((prev) => ({
                      ...prev,
                      [e.target.id]: t<string>('Option already exists'),
                    }));
                  }
                }}
                onChange={(e) => {
                  setState((prev) => {
                    const shouldAddEmptyOption =
                      prev.options.length < MAX_POLL_OPTIONS &&
                      (!prev.options ||
                        (prev.options.slice(i + 1).length === 0 && !!e.target.value));
                    const shouldRemoveOption =
                      prev.options && prev.options.slice(i + 1).length > 0 && !e.target.value;

                    const optionListHead = prev.options ? prev.options.slice(0, i) : [];
                    const optionListTail = shouldAddEmptyOption
                      ? [{ id: nanoid(), text: '' }]
                      : (prev.options || []).slice(i + 1);

                    if (
                      (errors[option.id] && !e.target.value) ||
                      (VALIDATION_ERRORS[errors[option.id]] &&
                        !findOptionDuplicate({ id: e.target.id, text: e.target.value }))
                    ) {
                      setErrors((prev) => {
                        delete prev[option.id];
                        return prev;
                      });
                    }

                    return {
                      ...prev,
                      options: [
                        ...optionListHead,
                        ...(shouldRemoveOption ? [] : [{ ...option, text: e.target.value }]),
                        ...optionListTail,
                      ],
                    };
                  });
                }}
                onKeyUp={(event) => {
                  if (event.key === 'Enter') {
                    const nextInputId = options[i + 1].id;
                    document.getElementById(nextInputId)?.focus();
                  }
                }}
                placeholder={t<string>('Add an option')}
                type='text'
                value={option.text}
              />
            </div>
            {draggable && <div className='str-chat__drag-handle' />}
          </div>
        ))}
      </DragAndDropContainer>
    </fieldset>
  );
};
