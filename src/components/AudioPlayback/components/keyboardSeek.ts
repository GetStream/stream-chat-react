import type { KeyboardEvent } from 'react';
import type { SeekFn as AudioPlayerSeekFn } from '../AudioPlayer';

type SeekParams = Parameters<AudioPlayerSeekFn>[0];

const DEFAULT_KEYBOARD_PROGRESS_STEP = 5;

const getNextProgressByKey = ({
  key,
  progress,
  step,
}: {
  key: string;
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
  progress,
  seek,
  step = DEFAULT_KEYBOARD_PROGRESS_STEP,
}: {
  event: KeyboardEvent<HTMLDivElement>;
  progress: number;
  seek: (params: SeekParams) => void;
  step?: number;
}) => {
  const nextProgress = getNextProgressByKey({
    key: event.key,
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
