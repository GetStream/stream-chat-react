import clsx from 'clsx';
import React from 'react';
import { handleProgressBarKeyboardSeek } from './keyboardSeek';
import { getAudioTrackSliderAriaValueText } from './progressBarA11y';
import { useInteractiveProgressBar } from './useInteractiveProgressBar';
import type { SeekFn as AudioPlayerSeekFn } from '../AudioPlayer';
import { useTranslationContext } from '../../../context';

type SeekParams = Parameters<AudioPlayerSeekFn>[0];

export type ProgressBarProps = {
  /** Progress expressed in fractional number value btw 0 and 100. */
  progress: number;
  /** Total track duration in seconds. */
  durationSeconds?: number;
  /** Current elapsed position in seconds. */
  secondsElapsed?: number;
  seek: (params: SeekParams) => void;
} & Pick<React.ComponentProps<'div'>, 'className'>;

export const ProgressBar = ({
  className,
  durationSeconds,
  progress,
  secondsElapsed,
  seek,
}: ProgressBarProps) => {
  const { t } = useTranslationContext('ProgressBar');
  const {
    handleDrag,
    handleDragStart,
    handleDragStop,
    indicatorLeft,
    setProgressIndicator,
    setRoot,
  } = useInteractiveProgressBar({ progress, seek });
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const ariaValueText = getAudioTrackSliderAriaValueText({
    durationSeconds,
    progress: normalizedProgress,
    secondsElapsed,
    t,
  });

  return (
    <div
      aria-label={t('aria/Seek audio position')}
      aria-orientation='horizontal'
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(normalizedProgress)}
      aria-valuetext={ariaValueText}
      className={clsx(
        'str-chat__message-attachment-audio-widget--progress-track',
        className,
      )}
      data-progress={normalizedProgress}
      data-testid='audio-progress'
      onClick={seek}
      onKeyDown={(event) =>
        handleProgressBarKeyboardSeek({ event, progress: normalizedProgress, seek })
      }
      onPointerDown={handleDragStart}
      onPointerMove={handleDrag}
      onPointerUp={handleDragStop}
      ref={setRoot}
      role='slider'
      style={
        {
          '--str-chat__message-attachment-audio-widget-progress':
            normalizedProgress + '%',
        } as React.CSSProperties
      }
      tabIndex={0}
    >
      <div
        aria-hidden='true'
        className='str-chat__message-attachment-audio-widget--progress-indicator'
        ref={setProgressIndicator}
        style={{ insetInlineStart: `${indicatorLeft}px` }}
      />
    </div>
  );
};
