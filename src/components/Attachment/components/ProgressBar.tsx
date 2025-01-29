import clsx from 'clsx';
import React from 'react';

export type ProgressBarProps = {
  /** Progress expressed in fractional number value btw 0 and 100. */
  progress: number;
} & Pick<React.ComponentProps<'div'>, 'className' | 'onClick'>;

export const ProgressBar = ({ className, onClick, progress }: ProgressBarProps) => (
  <div
    className={clsx(
      'str-chat__message-attachment-audio-widget--progress-track',
      className,
    )}
    data-progress={progress}
    data-testid='audio-progress'
    onClick={onClick}
    role='progressbar'
    style={
      {
        '--str-chat__message-attachment-audio-widget-progress': progress + '%',
      } as React.CSSProperties
    }
  >
    <div
      className='str-chat__message-attachment-audio-widget--progress-slider'
      style={{ left: `${progress}px` }}
    />
  </div>
);
