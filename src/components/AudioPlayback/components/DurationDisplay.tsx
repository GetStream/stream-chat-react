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
};

function formatTime(totalSeconds?: number) {
  if (totalSeconds == null || Number.isNaN(totalSeconds) || totalSeconds < 0) {
    return null;
  }
  const s = Math.floor(totalSeconds);
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function DurationDisplay({
  className,
  duration,
  isPlaying,
  secondsElapsed,
}: DurationDisplayProps) {
  const formattedDuration = formatTime(duration);
  const formattedSecondsElapsed = formatTime(secondsElapsed);

  return (
    <div
      className={clsx(
        'str-chat__duration-display',
        {
          'str-chat__duration-display--hasProgress':
            !!secondsElapsed && secondsElapsed > 0 && secondsElapsed < (duration || 0),
          'str-chat__duration-display--isPlaying': isPlaying,
        },
        className,
      )}
    >
      {isPlaying && (
        <span className='str-chat__duration-display__time-elapsed'>
          {formattedSecondsElapsed}
        </span>
      )}
      {!!(formattedDuration && formattedSecondsElapsed) && <> / </>}
      {formattedDuration && (
        <span className='str-chat__duration-display__duration'>{formattedDuration}</span>
      )}
    </div>
  );
}
