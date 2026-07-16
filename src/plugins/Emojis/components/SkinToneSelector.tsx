import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useEmojiPickerContext } from '../context/EmojiPickerContext';
import { useTranslationContext } from '../../../context';

const ARROW_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];

/**
 * Skin-tone picker rendered in the footer. Collapsed to the active tone; expands to a
 * WAI-ARIA radiogroup: focus moves onto the checked tone on open, a roving tabindex keeps
 * one tone tab-reachable, arrow/Home/End keys move the selection (selection follows
 * focus), and Escape collapses back to the toggle without closing the whole picker.
 * Reads the active tone + available tones from context and reports changes via
 * `setSkinTone`.
 */
export const SkinToneSelector = () => {
  const { t } = useTranslationContext();
  const { setSkinTone, skinToneIndex, skinTones } = useEmojiPickerContext();
  const maxIndex = skinTones.length - 1;
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const returnFocusToToggle = useRef(false);
  const activeTone = skinTones[skinToneIndex] ?? skinTones[0];

  const radios = () =>
    Array.from(
      groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [],
    );

  useEffect(() => {
    if (expanded) {
      // Move focus into the group, onto the checked tone, when it opens.
      radios()[skinToneIndex]?.focus();
    } else if (returnFocusToToggle.current) {
      returnFocusToToggle.current = false;
      toggleRef.current?.focus();
    }
    // Focus is managed on open/close only; arrow navigation focuses the target directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  if (!expanded) {
    return (
      <button
        aria-label={t('aria/Choose default skin tone')}
        className='str-chat__emoji-picker__skin-tone-toggle'
        onClick={() => setExpanded(true)}
        ref={toggleRef}
        type='button'
      >
        <span aria-hidden='true'>{activeTone.glyph}</span>
      </button>
    );
  }

  const collapse = (returnFocus: boolean) => {
    returnFocusToToggle.current = returnFocus;
    setExpanded(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation(); // collapse the group, not the whole picker
      collapse(true);
      return;
    }
    if (!ARROW_KEYS.includes(event.key)) return;
    event.preventDefault();

    let next = skinToneIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = skinToneIndex >= maxIndex ? 0 : skinToneIndex + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = skinToneIndex <= 0 ? maxIndex : skinToneIndex - 1;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = maxIndex;
    }

    // All tones are mounted, so focus the target now; selection follows focus.
    radios()[next]?.focus();
    setSkinTone(next);
  };

  return (
    <div
      aria-label={t('aria/Choose default skin tone')}
      className='str-chat__emoji-picker__skin-tones'
      onKeyDown={onKeyDown}
      ref={groupRef}
      role='radiogroup'
    >
      {skinTones.map((tone, index) => (
        <button
          aria-checked={index === skinToneIndex}
          aria-label={t(tone.labelKey)}
          className={clsx('str-chat__emoji-picker__skin-tone', {
            'str-chat__emoji-picker__skin-tone--active': index === skinToneIndex,
          })}
          key={tone.labelKey}
          onClick={() => {
            setSkinTone(index);
            collapse(true);
          }}
          role='radio'
          tabIndex={index === skinToneIndex ? 0 : -1}
          type='button'
        >
          <span aria-hidden='true'>{tone.glyph}</span>
        </button>
      ))}
    </div>
  );
};
