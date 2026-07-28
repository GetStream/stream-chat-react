import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import React, { useEffect, useRef } from 'react';
import type { PollComposerOption } from 'stream-chat';

import { IconReorder } from '../../Icons';
import { useAriaLiveAnnouncer } from '../../Accessibility';
import { useTranslationContext } from '../../../context';

type PollOptionReorderHandleProps = {
  index: number;
  isActive: boolean;
  onActivate: (optionId: string) => void;
  onDeselect: () => void;
  onMove: (direction: -1 | 1) => void;
  option: PollComposerOption;
  registerRef: (index: number, element: HTMLButtonElement | null) => void;
  /** Total number of options. Used to embed "position N of total" into the
   * active handle's aria-label so VoiceOver's native focus announcement after a
   * move carries the new position instead of just "Reorder option N". */
  totalOptionCount: number;
};

export const PollOptionReorderHandle = ({
  index,
  isActive,
  onActivate,
  onDeselect,
  onMove,
  option,
  registerRef,
  totalOptionCount,
}: PollOptionReorderHandleProps) => {
  const { t } = useTranslationContext();
  const announce = useAriaLiveAnnouncer();
  const hasAnnouncedFocusRef = useRef(false);
  const focusAnnouncementFrameRef = useRef<number | null>(null);

  const position = index + 1;
  const optionLabel = option.text.trim() || t('aria/Option {{ position }}', { position });
  // While picked up, fold the option text + new position into the aria-label
  // so VoiceOver speaks "Reorder 'option B' at position 1 of 3" on the focus
  // event triggered by ArrowUp/ArrowDown. That replaces the otherwise
  // redundant "Reorder option N, selected, toggle button" native announcement
  // and removes the need for a duplicate live-region "moved to position"
  // message.
  const ariaLabel = isActive
    ? t('aria/Reorder "{{ option }}" at position {{ position }} of {{ total }}', {
        option: optionLabel,
        position,
        total: totalOptionCount,
      })
    : t('aria/Reorder option {{ position }}', { position });

  useEffect(
    () => () => {
      if (focusAnnouncementFrameRef.current === null) return;
      cancelAnimationFrame(focusAnnouncementFrameRef.current);
    },
    [],
  );

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!isActive) return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onMove(-1);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onMove(1);
      return;
    }
    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      onDeselect();
    }
  };

  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className='str-chat__drag-handle-button'
      onBlur={() => {
        if (focusAnnouncementFrameRef.current !== null) {
          cancelAnimationFrame(focusAnnouncementFrameRef.current);
          focusAnnouncementFrameRef.current = null;
        }
        hasAnnouncedFocusRef.current = false;
        if (isActive) {
          // Tabbing or clicking away while picked up drops the option.
          onDeselect();
        }
      }}
      onClick={() => {
        if (isActive) {
          onDeselect();
          return;
        }
        onActivate(option.id);
      }}
      onFocus={() => {
        if (isActive || hasAnnouncedFocusRef.current) return;

        hasAnnouncedFocusRef.current = true;
        focusAnnouncementFrameRef.current = requestAnimationFrame(() => {
          announce(
            t(
              'aria/Press Space to select this option, use the Up and Down arrow keys to move it, then press Space again to deselect it.',
            ),
            { priority: 'assertive' },
          );
          focusAnnouncementFrameRef.current = null;
        });
      }}
      onKeyDown={onKeyDown}
      ref={(element) => {
        registerRef(index, element);
      }}
      type='button'
    >
      <IconReorder className='str-chat__drag-handle' />
    </button>
  );
};
