import React, { useEffect, useState } from 'react';
import { useTimeElapsed } from './hooks/useTimeElapsed';
import { useMessageInputContext } from '../../../context';
import { RecordingTimer } from './RecordingTimer';
import { IconMicrophone } from '../../Icons';

type WaveformProps = {
  maxDataPointsDrawn?: number;
};

const AudioRecordingWaveform = ({ maxDataPointsDrawn = 200 }: WaveformProps) => {
  const {
    recordingController: { recorder },
  } = useMessageInputContext();

  const [amplitudes, setAmplitudes] = useState<number[]>([]);

  useEffect(() => {
    if (!recorder?.amplitudeRecorder) return;
    const amplitudesSubscription =
      recorder.amplitudeRecorder.amplitudes.subscribe(setAmplitudes);
    return () => {
      amplitudesSubscription.unsubscribe();
    };
  }, [recorder]);

  if (!recorder) return null;

  return (
    <div className='str-chat__waveform-box-container'>
      <div className='str-chat__wave-progress-bar__track'>
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
    </div>
  );
};
export const AudioRecordingPreview = () => {
  const {
    recordingController: { recorder },
  } = useMessageInputContext();

  const initialSeconds = recorder?.durationMs ? recorder.durationMs / 1000 : 0;
  const { secondsElapsed, startCounter, stopCounter } = useTimeElapsed({
    initialSeconds,
  });

  useEffect(() => {
    if (!recorder?.mediaRecorder) return;
    const { mediaRecorder } = recorder;

    if (mediaRecorder.state === 'recording') {
      startCounter();
    }

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
    <div className='str-chat__audio-recorder__recording-preview'>
      <IconMicrophone />
      <RecordingTimer durationSeconds={secondsElapsed} />
      <AudioRecordingWaveform />
    </div>
  );
};
