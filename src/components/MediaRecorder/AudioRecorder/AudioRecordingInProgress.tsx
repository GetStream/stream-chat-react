import React, { useEffect, useState } from 'react';
import { useTimeElapsed } from '../../MessageInput/hooks/useTimeElapsed';
import { useMessageInputContext } from '../../../context';
import { RecordingTimer } from './RecordingTimer';

type WaveformProps = {
  maxDataPointsDrawn?: number;
};

const AudioRecordingWaveform = ({ maxDataPointsDrawn = 100 }: WaveformProps) => {
  const {
    audioRecordingController: { recorder },
  } = useMessageInputContext();

  const [amplitudes, setAmplitudes] = useState<number[]>([]);

  useEffect(() => {
    if (!recorder?.amplitudeRecorder) return;
    const amplitudesSubscription = recorder.amplitudeRecorder.amplitudes.subscribe(setAmplitudes);
    return () => {
      amplitudesSubscription.unsubscribe();
    };
  }, [recorder]);

  if (!recorder) return null;

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
export const AudioRecordingInProgress = () => {
  const { secondsElapsed, startCounter, stopCounter } = useTimeElapsed();
  const {
    audioRecordingController: { recorder },
  } = useMessageInputContext();

  useEffect(() => {
    if (!recorder?.mediaRecorder) return;

    const { mediaRecorder } = recorder;
    mediaRecorder.addEventListener('start', startCounter);
    mediaRecorder.addEventListener('resume', startCounter);
    mediaRecorder.addEventListener('stop', stopCounter);
    mediaRecorder.addEventListener('pause', stopCounter);

    return () => {
      mediaRecorder.removeEventListener('start', startCounter);
      mediaRecorder.removeEventListener('resume', startCounter);
      mediaRecorder.removeEventListener('stop', stopCounter);
      mediaRecorder.removeEventListener('pause', stopCounter);
    };
  }, [recorder, startCounter, stopCounter]);
  return (
    <React.Fragment>
      <RecordingTimer durationSeconds={secondsElapsed} />
      <div className='str-chat__waveform-box-container'>
        <AudioRecordingWaveform />
      </div>
    </React.Fragment>
  );
};
