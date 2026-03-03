import React from 'react';
import clsx from 'clsx';

type DurationDisplayProps = {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Optional className for styling */
  className?: string;
  /** Total duration in seconds */
  duration?: number;
  /** Elapsed time in seconds */
  secondsElapsed?: number;
  /** Show remaining time instead of elapsed when possible */
  showRemaining?: boolean;
};

function formatTime(totalSeconds?: number, rounding: 'ceil' | 'floor' = 'ceil') {
  if (totalSeconds == null || Number.isNaN(totalSeconds) || totalSeconds < 0) {
    return null;
  }
  const roundedSeconds =
    rounding === 'floor' ? Math.floor(totalSeconds) : Math.ceil(totalSeconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const seconds = roundedSeconds % 60;
  const minSec = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`;
  return hours ? `${String(hours).padStart(2, '0')}:${minSec}` : minSec;
}

export function DurationDisplay({
  className,
  duration,
  isPlaying,
  secondsElapsed,
  showRemaining = false,
}: DurationDisplayProps) {
  const remainingSeconds =
    duration != null && secondsElapsed != null
      ? Math.max(0, duration - secondsElapsed)
      : undefined;
  const formattedDuration = formatTime(duration);
  const formattedSecondsElapsed = formatTime(secondsElapsed);
  const formattedRemaining = formatTime(remainingSeconds);

  const shouldShowElapsed =
    !!secondsElapsed && secondsElapsed > 0 && secondsElapsed < (duration || 0);
  const canShowRemaining = showRemaining && duration != null && secondsElapsed != null;
  const primaryValue = showRemaining ? formattedRemaining : formattedSecondsElapsed;
  const showPrimary = (canShowRemaining || shouldShowElapsed) && !!primaryValue;
  const showDuration = !showPrimary && !!formattedDuration;

  return (
    <div
      className={clsx(
        'str-chat__duration-display',
        {
          'str-chat__duration-display--hasProgress': !!secondsElapsed,
          'str-chat__duration-display--isPlaying': isPlaying,
        },
        className,
      )}
    >
      {showPrimary && (
        <span className='str-chat__duration-display__time-elapsed'>{primaryValue}</span>
      )}
      {showDuration && (
        <span className='str-chat__duration-display__duration'>{formattedDuration}</span>
      )}
    </div>
  );
}
