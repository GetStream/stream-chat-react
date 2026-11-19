import React, { useEffect, useState } from 'react';
import { useAmplitudeBarCapacity } from './hooks/useAmplitudeBarCapacity';
import { useTimeElapsed } from './hooks/useTimeElapsed';
import { useComponentContextIcons, useMessageComposerContext } from '../../../context';
import { RecordingTimer } from './RecordingTimer';

/** The latest amplitudes of the recording in progress, as many as fill the track. */
const AudioRecordingWaveform = () => {
  const {
    recordingController: { recorder },
  } = useMessageComposerContext();

  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [track, setTrack] = useState<HTMLDivElement | null>(null);
  const barCapacity = useAmplitudeBarCapacity(track, amplitudes.length > 0);

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
      <div className='str-chat__wave-progress-bar__track' ref={setTrack}>
        {amplitudes.slice(-barCapacity).map((amplitude, i) => (
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
  const { IconVoice } = useComponentContextIcons();
  const {
    recordingController: { recorder },
  } = useMessageComposerContext();

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
      <IconVoice />
      <RecordingTimer durationSeconds={secondsElapsed} />
      <AudioRecordingWaveform />
    </div>
  );
};
