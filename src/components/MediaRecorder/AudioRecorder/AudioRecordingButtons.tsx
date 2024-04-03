import React from 'react';
import { MicIcon } from '../../MessageInput/icons';

export type StartRecordingAudioButtonProps = React.ComponentProps<'button'>;

export const StartRecordingAudioButton = (props: StartRecordingAudioButtonProps) => (
  <button
    aria-label='Start recording audio'
    className='str-chat__start-recording-audio-button'
    data-testid='start-recording-audio-button'
    {...props}
  >
    <MicIcon />
  </button>
);
