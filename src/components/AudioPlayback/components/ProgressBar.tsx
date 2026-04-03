import clsx from 'clsx';
import React from 'react';
import { useInteractiveProgressBar } from './useInteractiveProgressBar';
import type { SeekFn as AudioPlayerSeekFn } from '../AudioPlayer';

type SeekParams = Parameters<AudioPlayerSeekFn>[0];

export type ProgressBarProps = {
  /** Progress expressed in fractional number value btw 0 and 100. */
  progress: number;
  seek: (params: SeekParams) => void;
} & Pick<React.ComponentProps<'div'>, 'className'>;

export const ProgressBar = ({ className, progress, seek }: ProgressBarProps) => {
  const {
    handleDrag,
    handleDragStart,
    handleDragStop,
    indicatorLeft,
    setProgressIndicator,
    setRoot,
  } = useInteractiveProgressBar({ progress, seek });

  return (
    <div
      className={clsx(
        'str-chat__message-attachment-audio-widget--progress-track',
        className,
      )}
      data-progress={progress}
      data-testid='audio-progress'
      onClick={seek}
      onPointerDown={handleDragStart}
      onPointerMove={handleDrag}
      onPointerUp={handleDragStop}
      ref={setRoot}
      role='progressbar'
      style={
        {
          '--str-chat__message-attachment-audio-widget-progress': progress + '%',
        } as React.CSSProperties
      }
    >
      <div
        className='str-chat__message-attachment-audio-widget--progress-indicator'
        ref={setProgressIndicator}
        style={{ insetInlineStart: `${indicatorLeft}px` }}
      />
    </div>
  );
};
