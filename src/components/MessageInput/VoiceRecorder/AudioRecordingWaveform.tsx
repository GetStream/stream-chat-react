import { useMessageInputContext } from '../../../context';
import React from 'react';

type WaveformProps = {
  maxDataPointsDrawn?: number;
};
export const AudioRecordingWaveform = ({ maxDataPointsDrawn = 100 }: WaveformProps) => {
  const {
    voiceRecordingController: { amplitudes },
  } = useMessageInputContext();

  return (
    <div className='str-chat__audio_recorder__waveform-box'>
      {amplitudes.slice(-maxDataPointsDrawn).map((amplitude, i) => (
        <div
          className='str-chat__wave-progress-bar__amplitude-bar'
          key={`amplitude-${i}-voice-recording`}
          style={
            {
              '--str-chat__wave-progress-bar__amplitude-bar-height': amplitude
                ? amplitude * 100 + '%'
                : '0%',
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
