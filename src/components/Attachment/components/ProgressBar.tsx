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
    style={{
      background: `linear-gradient(
		 to right,
		 var(--str-chat__primary-color),
		 var(--str-chat__primary-color) ${progress}%,
		 var(--str-chat__disabled-color) ${progress}%,
		 var(--str-chat__disabled-color)
	  )`,
    }}
  >
    <div
      className='str-chat__message-attachment-audio-widget--progress-indicator'
      style={{ left: `${progress}px` }}
    />
  </div>
);
