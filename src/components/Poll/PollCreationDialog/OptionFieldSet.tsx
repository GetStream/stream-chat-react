import clsx from 'clsx';
import React, { useCallback, useMemo, useRef } from 'react';
import { TextInput } from '../../Form/TextInput';
import { useTranslationContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useStateStore } from '../../../store';
import type { PollComposerState } from 'stream-chat';
import { IconMinusCircle } from '../../Icons';
import { Button, type ButtonProps } from '../../Button';
import { TextInputFieldSet } from '../../Form/TextInputFieldSet';
import { AriaLiveRegion } from '../../Accessibility';
import { PollOptionReorderHandle } from './PollOptionReorderHandle';

const pollComposerStateSelector = (state: PollComposerState) => ({
  errors: state.errors.options,
  options: state.data.options,
});

export const OptionFieldSet = () => (
  <AriaLiveRegion>
    <OptionFieldSetContent />
  </AriaLiveRegion>
);

const OptionFieldSetContent = () => {
  const { pollComposer } = useMessageComposerController();
  const { errors, options } = useStateStore(
    pollComposer.state,
    pollComposerStateSelector,
  );
  const { t } = useTranslationContext('OptionFieldSet');
  const optionInputRefs = useRef<Array<HTMLInputElement | null>>([]);

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
      const nextOptions = [...pollComposer.options];
      if (!nextOptions.length) return;

      const removedOptionIndex = pollComposer.options.findIndex(
        (option) => option.id === removedOptionId,
      );

      if (removedOptionIndex === -1) return;
      nextOptions.splice(removedOptionIndex, 1);

      pollComposer.updateFields({
        options: nextOptions,
      });

      if (!nextOptions.length) return;
      const nextFocusedOptionIndex = Math.min(removedOptionIndex, nextOptions.length - 1);
      requestAnimationFrame(() => {
        optionInputRefs.current[nextFocusedOptionIndex]?.focus();
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
            key={option.id}
          >
            <TextInput
              className='str-chat__form__input-field__value'
              error={!!error}
              fieldMessagePlacement='inside'
              id={option.id}
              leading={
                draggable ? <PollOptionReorderHandle option={option} /> : undefined
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
                  optionInputRefs.current[i + 1]?.focus();
                }
              }}
              placeholder={t('Add an option')}
              ref={(element) => {
                optionInputRefs.current[i] = element;
              }}
              trailing={
                draggable ? (
                  <RemoveOptionButton
                    aria-label={t('aria/Remove option')}
                    onClick={() => clearOption(option.id)}
                  />
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
    size='xs'
    variant='secondary'
    {...props}
  >
    <IconMinusCircle />
  </Button>
);
