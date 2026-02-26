import clsx from 'clsx';
import React, { useCallback, useMemo } from 'react';
import { TextInput } from '../../Form/TextInput';
import { useTranslationContext } from '../../../context';
import { useMessageComposer } from '../../MessageInput';
import { useStateStore } from '../../../store';
import type { PollComposerState } from 'stream-chat';
import { IconCircleMinus, IconDotGrid2x3 } from '../../Icons';
import { Button, type ButtonProps } from '../../Button';
import { TextInputFieldSet } from '../../Form/TextInputFieldSet';

const pollComposerStateSelector = (state: PollComposerState) => ({
  errors: state.errors.options,
  options: state.data.options,
});

export const OptionFieldSet = () => {
  const { pollComposer } = useMessageComposer();
  const { errors, options } = useStateStore(
    pollComposer.state,
    pollComposerStateSelector,
  );
  const { t } = useTranslationContext('OptionFieldSet');

  const knownValidationErrors = useMemo<Record<string, string>>(
    () => ({
      'Option already exists': t('Option already exists'),
      'Option is empty': t('Option is empty'),
    }),
    [t],
  );

  const onSetNewOrder = useCallback(
    (newOrder: number[]) => {
      const prevOptions = pollComposer.options;
      pollComposer.updateFields({ options: newOrder.map((index) => prevOptions[index]) });
    },
    [pollComposer],
  );

  const clearOption = useCallback(
    (removedOptionId: string) => {
      pollComposer.updateFields({
        options: pollComposer.options.filter((option) => option.id !== removedOptionId),
      });
    },
    [pollComposer],
  );

  const draggable = options.length > 1;

  return (
    <TextInputFieldSet
      draggable={draggable}
      label={t('Options')}
      onSetNewOrder={onSetNewOrder}
    >
      {options.map((option, i) => {
        const error = errors?.[option.id];
        return (
          <div
            className={clsx('str-chat__form__input-field', {
              'str-chat__form__input-field--draggable': draggable,
              'str-chat__form__input-field--has-error': error,
            })}
            key={`new-poll-option-${i}`}
          >
            <TextInput
              className='str-chat__form__input-field__value'
              error={!!error}
              id={option.id}
              leading={
                draggable ? (
                  <IconDotGrid2x3 className='str-chat__drag-handle' />
                ) : undefined
              }
              message={
                error ? (
                  <span data-testid='poll-option-input-field-error'>
                    {knownValidationErrors[error] ?? t('Error')}
                  </span>
                ) : undefined
              }
              onBlur={() => {
                pollComposer.handleFieldBlur('options');
              }}
              onChange={(e) => {
                pollComposer.updateFields({
                  options: { index: i, text: e.target.value },
                });
              }}
              onKeyUp={(event) => {
                const isFocusedLastOptionField = i === options.length - 1;
                if (event.key === 'Enter' && !isFocusedLastOptionField) {
                  const nextInputId = options[i + 1].id;
                  document.getElementById(nextInputId)?.focus();
                }
              }}
              placeholder={t('Add an option')}
              trailing={
                option.text ? (
                  <RemoveOptionButton onClick={() => clearOption(option.id)} />
                ) : undefined
              }
              type='text'
              value={option.text}
            />
          </div>
        );
      })}
    </TextInputFieldSet>
  );
};

const RemoveOptionButton = ({ className, ...props }: ButtonProps) => (
  <Button
    appearance='ghost'
    circular
    className={clsx('str-chat__form__remove-option-button', className)}
    size='sm'
    variant='secondary'
    {...props}
  >
    <IconCircleMinus />
  </Button>
);
