import type { KeyboardEvent } from 'react';
import type { SeekFn as AudioPlayerSeekFn } from '../AudioPlayer';

type SeekParams = Parameters<AudioPlayerSeekFn>[0];

const DEFAULT_KEYBOARD_PROGRESS_STEP = 5;
const DEFAULT_KEYBOARD_PROGRESS_LARGE_STEP = 10;

const getNextProgressByKey = ({
  key,
  largeStep,
  progress,
  step,
}: {
  key: string;
  largeStep: number;
  progress: number;
  step: number;
}) => {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return Math.min(100, progress + step);
    case 'ArrowLeft':
    case 'ArrowDown':
      return Math.max(0, progress - step);
    case 'PageUp':
      return Math.min(100, progress + largeStep);
    case 'PageDown':
      return Math.max(0, progress - largeStep);
    case 'Home':
      return 0;
    case 'End':
      return 100;
    default:
      return null;
  }
};

export const handleProgressBarKeyboardSeek = ({
  event,
  largeStep = DEFAULT_KEYBOARD_PROGRESS_LARGE_STEP,
  progress,
  seek,
  step = DEFAULT_KEYBOARD_PROGRESS_STEP,
}: {
  event: KeyboardEvent<HTMLDivElement>;
  largeStep?: number;
  progress: number;
  seek: (params: SeekParams) => void;
  step?: number;
}) => {
  const nextProgress = getNextProgressByKey({
    key: event.key,
    largeStep,
    progress,
    step,
  });

  if (nextProgress === null) return;

  event.preventDefault();
  const currentTarget = event.currentTarget;
  const { width, x } = currentTarget.getBoundingClientRect();

  seek({
    clientX: x + (width * nextProgress) / 100,
    currentTarget,
  });
};
