import React from 'react';
import { MicIcon } from '../icons';

export type StartRecordingAudioProps = React.ComponentProps<'button'>;

export const StartRecordingAudio = (props: StartRecordingAudioProps) => (
  <button
    aria-label='Start recording audio'
    className='str-chat__start-recording-audio-button'
    data-testid='start-recording-audio-button'
    {...props}
  >
    <MicIcon />
  </button>
);
