import React, { useEffect } from 'react';
import { AudioRecordingWaveform } from './AudioRecordingWaveform';
import { useTimeElapsed } from '../../MessageInput/hooks/useTimeElapsed';
import { useMessageInputContext } from '../../../context';
import { RecordingTimer } from './RecordingTimer';

export const AudioRecordingInProgress = () => {
  const { secondsElapsed, startCounter, stopCounter } = useTimeElapsed();
  const {
    voiceRecordingController: { mediaRecorder },
  } = useMessageInputContext();

  useEffect(() => {
    if (!mediaRecorder) return;
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
  }, [mediaRecorder, startCounter, stopCounter]);
  return (
    <React.Fragment>
      <RecordingTimer durationSeconds={secondsElapsed} />
      <div className='str-chat__waveform-box-container'>
        <AudioRecordingWaveform />
      </div>
    </React.Fragment>
  );
};
