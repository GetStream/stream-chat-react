import React, { forwardRef } from 'react';
import { Button } from '../../Button';
import { IconMicrophone } from '../../Icons';
import clsx from 'clsx';

export type StartRecordingAudioButtonProps = React.ComponentProps<'button'>;

export const StartRecordingAudioButton = forwardRef<
  HTMLButtonElement,
  StartRecordingAudioButtonProps
>(function StartRecordingAudioButton(props, ref) {
  return (
    <Button
      aria-label='Start recording audio'
      className={clsx(
        'str-chat__start-recording-audio-button',
        'str-chat__button--ghost',
        'str-chat__button--secondary',
        'str-chat__button--size-sm',
        'str-chat__button--circular',
      )}
      data-testid='start-recording-audio-button'
      {...props}
      ref={ref}
    >
      <IconMicrophone />
    </Button>
  );
});
