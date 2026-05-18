import clsx from 'clsx';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TextInput } from '../../Form/TextInput';
import { useTranslationContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useStateStore } from '../../../store';
import type { PollComposerOption, PollComposerState } from 'stream-chat';
import { IconMinusCircle } from '../../Icons';
import { Button, type ButtonProps } from '../../Button';
import { TextInputFieldSet } from '../../Form/TextInputFieldSet';
import { AriaLiveRegion, useAriaLiveAnnouncer } from '../../Accessibility';
import { PollOptionReorderHandle } from './PollOptionReorderHandle';

const pollComposerStateSelector = (state: PollComposerState) => ({
  errors: state.errors.options,
  options: state.data.options,
});

export const OptionFieldSet = () => (
  // Render the live region inline so it stays inside the `aria-modal="true"`
  // poll-creation dialog subtree. VoiceOver and other screen readers suppress
  // live regions outside an active aria-modal container, which is why portalling
  // to `document.body` swallowed the pickup/move/drop announcements here.
  <AriaLiveRegion inline>
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
  const announce = useAriaLiveAnnouncer();
  const optionInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const handleRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingFocusIndexRef = useRef<number | null>(null);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);

  const knownValidationErrors = useMemo<Record<string, string>>(
    () => ({
      'Option already exists': t('Option already exists'),
      'Option is empty': t('Option is empty'),
    }),
    [t],
  );

  const labelForOption = useCallback(
    (option: PollComposerOption, position: number) =>
      option.text.trim() || t('aria/Option {{ position }}', { position }),
    [t],
  );

  const registerHandleRef = useCallback(
    (index: number, element: HTMLButtonElement | null) => {
      handleRefs.current[index] = element;
    },
    [],
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

      if (activeOptionId === removedOptionId) {
        setActiveOptionId(null);
      }

      if (!nextOptions.length) return;
      const nextFocusedOptionIndex = Math.min(removedOptionIndex, nextOptions.length - 1);
      requestAnimationFrame(() => {
        optionInputRefs.current[nextFocusedOptionIndex]?.focus();
      });
    },
    [activeOptionId, pollComposer],
  );

  const handleActivate = useCallback(
    (optionId: string) => {
      const idx = pollComposer.options.findIndex((option) => option.id === optionId);
      if (idx === -1) return;
      const option = pollComposer.options[idx];
      setActiveOptionId(optionId);
      announce(
        t(
          'aria/Picked up "{{ option }}". Use arrow keys to reorder. Press Space or Tab to drop.',
          { option: labelForOption(option, idx + 1) },
        ),
        'assertive',
      );
    },
    [announce, labelForOption, pollComposer, t],
  );

  const handleDeselect = useCallback(() => {
    if (!activeOptionId) return;
    const idx = pollComposer.options.findIndex((option) => option.id === activeOptionId);
    const option = idx === -1 ? null : pollComposer.options[idx];

    setActiveOptionId(null);

    if (!option) return;

    announce(
      t('aria/Dropped "{{ option }}" at position {{ position }}.', {
        option: labelForOption(option, idx + 1),
        position: idx + 1,
      }),
      'assertive',
    );
  }, [activeOptionId, announce, labelForOption, pollComposer, t]);

  const handleMove = useCallback(
    (direction: -1 | 1) => {
      if (!activeOptionId) return;
      const currentIndex = pollComposer.options.findIndex(
        (option) => option.id === activeOptionId,
      );
      if (currentIndex === -1) return;
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= pollComposer.options.length) return;

      const nextOptions = [...pollComposer.options];
      const [moved] = nextOptions.splice(currentIndex, 1);
      nextOptions.splice(targetIndex, 0, moved);
      pollComposer.updateFields({ options: nextOptions });

      pendingFocusIndexRef.current = targetIndex;
      // No live-region announcement here on purpose. Once the focus moves to
      // the active option's new handle (in the layout effect below), VoiceOver
      // will speak that handle's aria-label, which already encodes the option
      // text and the new position ("Reorder 'option B' at position 1 of 3").
      // Emitting an additional polite "moved to position" message would just
      // duplicate that information.
    },
    [activeOptionId, pollComposer],
  );

  useLayoutEffect(() => {
    if (pendingFocusIndexRef.current === null) return;
    const idx = pendingFocusIndexRef.current;
    pendingFocusIndexRef.current = null;
    handleRefs.current[idx]?.focus();
  }, [options]);

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
            key={`option-row-${i}`}
          >
            <TextInput
              className='str-chat__form__input-field__value'
              error={!!error}
              fieldMessagePlacement='inside'
              id={option.id}
              leading={
                draggable ? (
                  <PollOptionReorderHandle
                    index={i}
                    isActive={option.id === activeOptionId}
                    onActivate={handleActivate}
                    onDeselect={handleDeselect}
                    onMove={handleMove}
                    option={option}
                    registerRef={registerHandleRef}
                    totalOptionCount={options.length}
                  />
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
