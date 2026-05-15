import React, { useEffect, useRef, useState } from 'react';
import type { PollComposerOption } from 'stream-chat';

import { IconReorder } from '../../Icons';
import { useAriaLiveAnnouncer } from '../../Accessibility';
import { useMessageComposerController } from '../../MessageComposer';
import { useTranslationContext } from '../../../context';

type PollOptionReorderHandleProps = {
  option: PollComposerOption;
};

export const PollOptionReorderHandle = ({ option }: PollOptionReorderHandleProps) => {
  const { pollComposer } = useMessageComposerController();
  const { t } = useTranslationContext();
  const announce = useAriaLiveAnnouncer();
  const hasAnnouncedFocusRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const focusAnnouncementFrameRef = useRef<number | null>(null);
  const [isKeyboardReordering, setIsKeyboardReordering] = useState(false);
  const optionPosition =
    pollComposer.options.findIndex((candidate) => candidate.id === option.id) + 1;
  const optionAnnouncementLabel =
    option.text.trim() || t('aria/Option {{ position }}', { position: optionPosition });

  const moveOption = (direction: -1 | 1) => {
    const currentIndex = pollComposer.options.findIndex(
      (candidate) => candidate.id === option.id,
    );
    if (currentIndex === -1) return false;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= pollComposer.options.length) return false;

    const nextOptions = [...pollComposer.options];
    const [movedOption] = nextOptions.splice(currentIndex, 1);
    nextOptions.splice(targetIndex, 0, movedOption);

    pollComposer.updateFields({ options: nextOptions });

    requestAnimationFrame(() => {
      buttonRef.current?.focus();
    });

    return true;
  };

  useEffect(
    () => () => {
      if (focusAnnouncementFrameRef.current === null) return;
      cancelAnimationFrame(focusAnnouncementFrameRef.current);
    },
    [],
  );

  return (
    <button
      aria-label={t('aria/Reorder option {{ position }}', {
        position: optionPosition,
      })}
      aria-pressed={isKeyboardReordering}
      className='str-chat__drag-handle-button'
      onBlur={() => {
        if (focusAnnouncementFrameRef.current !== null) {
          cancelAnimationFrame(focusAnnouncementFrameRef.current);
          focusAnnouncementFrameRef.current = null;
        }

        requestAnimationFrame(() => {
          if (document.activeElement === buttonRef.current) return;

          hasAnnouncedFocusRef.current = false;
          setIsKeyboardReordering(false);
        });
      }}
      onClick={() => {
        if (isKeyboardReordering) {
          setIsKeyboardReordering(false);
          announce(
            t('aria/Option "{{ option }}" deselected.', {
              option: optionAnnouncementLabel,
            }),
          );
          return;
        }

        setIsKeyboardReordering(true);
        announce(
          t('aria/Option "{{ option }}" selected.', {
            option: optionAnnouncementLabel,
          }),
        );
      }}
      onFocus={() => {
        if (hasAnnouncedFocusRef.current) return;

        hasAnnouncedFocusRef.current = true;
        focusAnnouncementFrameRef.current = requestAnimationFrame(() => {
          announce(
            t(
              'aria/Press Space to select this option, use the Up and Down arrow keys to move it, then press Space again to deselect it.',
            ),
            'assertive',
          );
          focusAnnouncementFrameRef.current = null;
        });
      }}
      onKeyDown={(event) => {
        if (!isKeyboardReordering) return;

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          const moved = moveOption(-1);
          if (!moved) return;
          announce(
            t('aria/Option "{{ option }}" moved to position {{ position }}.', {
              option: optionAnnouncementLabel,
              position: optionPosition - 1,
            }),
          );
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const moved = moveOption(1);
          if (!moved) return;
          announce(
            t('aria/Option "{{ option }}" moved to position {{ position }}.', {
              option: optionAnnouncementLabel,
              position: optionPosition + 1,
            }),
          );
        }
      }}
      ref={buttonRef}
      type='button'
    >
      <IconReorder className='str-chat__drag-handle' />
    </button>
  );
};
