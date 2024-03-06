import React from 'react';

export type ProgressBarProps = {
  /** Progress expressed in fractional number value btw 0 and 100. */
  progress: number;
} & Pick<React.ComponentProps<'div'>, 'onClick'>;

export const ProgressBar = ({ onClick, progress }: ProgressBarProps) => (
  <div
    className='str-chat__message-attachment-audio-widget--progress-track'
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
