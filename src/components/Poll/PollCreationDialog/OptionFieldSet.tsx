import clsx from 'clsx';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TextInput } from '../../Form/TextInput';
import { useTranslationContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useStateStore } from '../../../store';
import { POLL_COMPOSER_VALIDATION_CODE } from 'stream-chat';
import type {
  PollComposerOption,
  PollComposerState,
  PollComposerValidationCode,
} from 'stream-chat';
import { useComponentContextIcons } from '../../../context';
import { Button, type ButtonProps } from '../../Button';
import { TextInputFieldSet } from '../../Form/TextInputFieldSet';
import { VisuallyHidden } from '../../VisuallyHidden';
import { useStableId } from '../../UtilityComponents/useStableId';
import {
  useAriaLiveAnnouncer,
  useInteractionAnnouncements,
  useSettledAnnouncement,
} from '../../Accessibility';
import { PollOptionReorderHandle } from './PollOptionReorderHandle';

const pollComposerStateSelector = (state: PollComposerState) => ({
  errors: state.errors.options,
  options: state.data.options,
});

/**
 * Option inputs of the poll creation dialog, with reorder and removal. Announcements are delivered
 * through the modal `AriaLiveOutlet`, because screen readers ignore live regions outside the active
 * `aria-modal` container.
 */
export const OptionFieldSet = () => {
  const { pollComposer } = useMessageComposerController();
  const { errors, options } = useStateStore(
    pollComposer.state,
    pollComposerStateSelector,
  );
  const { t } = useTranslationContext();
  const announce = useAriaLiveAnnouncer();
  const { announceInteraction } = useInteractionAnnouncements();
  const optionInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const handleRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingFocusIndexRef = useRef<number | null>(null);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);

  const knownValidationErrors = useMemo<
    Partial<Record<PollComposerValidationCode, string>>
  >(
    () => ({
      [POLL_COMPOSER_VALIDATION_CODE.optionDuplicate]: t(
        'poll.suggestPollOption.optionAlreadyExists.label',
        'Option already exists',
      ),
      [POLL_COMPOSER_VALIDATION_CODE.optionEmpty]: t(
        'poll.optionFieldSet.optionEmpty.label',
        'Option is empty',
      ),
    }),
    [t],
  );

  const labelForOption = useCallback(
    (option: PollComposerOption, position: number) =>
      option.text.trim() ||
      t('poll.optionFieldSet.option.ariaLabel', 'Option {{ position }}', { position }),
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
      const [removedOption] = nextOptions.splice(removedOptionIndex, 1);

      pollComposer.updateFields({
        options: nextOptions,
      });

      // Polite, so it queues behind the focus move to the next field instead of interrupting it.
      announceInteraction('poll.optionRemoved', {
        option: labelForOption(removedOption, removedOptionIndex + 1),
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
    [activeOptionId, announceInteraction, labelForOption, pollComposer],
  );

  const handleActivate = useCallback(
    (optionId: string) => {
      const idx = pollComposer.options.findIndex((option) => option.id === optionId);
      if (idx === -1) return;
      const option = pollComposer.options[idx];
      setActiveOptionId(optionId);
      announceInteraction('poll.optionPickedUp', {
        option: labelForOption(option, idx + 1),
      });
    },
    [announceInteraction, labelForOption, pollComposer],
  );

  const handleDeselect = useCallback(() => {
    if (!activeOptionId) return;
    const idx = pollComposer.options.findIndex((option) => option.id === activeOptionId);
    const option = idx === -1 ? null : pollComposer.options[idx];

    setActiveOptionId(null);

    if (!option) return;

    announceInteraction('poll.optionDropped', {
      option: labelForOption(option, idx + 1),
      position: idx + 1,
    });
  }, [activeOptionId, announceInteraction, labelForOption, pollComposer]);

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
      // No announcement: the layout effect below focuses the new handle, and its aria-label
      // already carries the option text and position.
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

  // The reorder handle and remove button exist only with 2+ options. Each input's
  // `aria-describedby` points at hidden text saying so, but VoiceOver does not reliably speak
  // descriptions, so a polite cue is also announced once. It waits for `options` to go idle: the
  // screen reader re-reads the focused field when the list mutates, which supersedes live messages.
  const optionsHintId = useStableId();

  useSettledAnnouncement(announce, {
    active: draggable,
    message: t(
      'poll.optionFieldSet.optionsCanNowReordered.ariaLabel',
      'Options can now be reordered and removed.',
    ),
    settleKey: options,
  });

  return (
    <>
      <TextInputFieldSet
        draggable={draggable}
        label={t('poll.optionFieldSet.options.label', 'Options')}
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
                aria-describedby={draggable ? optionsHintId : undefined}
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
                      {knownValidationErrors[error.code] ?? error.message}
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
                placeholder={t(
                  'poll.optionFieldSet.addOption.placeholder',
                  'Add an Option',
                )}
                ref={(element) => {
                  optionInputRefs.current[i] = element;
                }}
                trailing={
                  draggable ? (
                    <RemoveOptionButton
                      // Named after its option so screen reader users can tell the rows apart.
                      aria-label={t(
                        'poll.optionFieldSet.removeOption.ariaLabel',
                        'Remove option: {{ option }}',
                        {
                          option: labelForOption(option, i + 1),
                        },
                      )}
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
      {draggable && (
        <VisuallyHidden id={optionsHintId}>
          {t(
            'poll.optionFieldSet.optionCanReorderedRemoved.ariaLabel',
            'This option can be reordered and removed.',
          )}
        </VisuallyHidden>
      )}
    </>
  );
};

const RemoveOptionButton = ({ className, ...props }: ButtonProps) => {
  const { IconMinusCircle } = useComponentContextIcons();

  return (
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
};
