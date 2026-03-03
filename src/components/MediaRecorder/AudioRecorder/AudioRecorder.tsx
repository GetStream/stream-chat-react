import React, { useMemo } from 'react';
import { AudioRecordingPlayback } from './AudioRecordingPlayback';
import { AudioRecordingPreview } from './AudioRecordingPreview';
import { MediaRecordingState } from '../classes';
import { useMessageInputContext } from '../../../context/MessageInputContext';
import { AudioRecorderRecordingControls } from './AudioRecorderRecordingControls';
import { isStopped } from './recordingStateIdentity';

export const AudioRecorder = () => {
  const {
    recordingController: { recorder, recording, recordingState },
  } = useMessageInputContext();

  const state = useMemo(
    () => ({
      paused: recordingState === MediaRecordingState.PAUSED,
      recording: recordingState === MediaRecordingState.RECORDING,
      stopped: recordingState === MediaRecordingState.STOPPED,
    }),
    [recordingState],
  );

  if (!recorder) return null;

  return (
    <div className='str-chat__audio_recorder' data-testid={'audio-recorder'}>
      {(isStopped(recordingState) || state.paused) && recording?.asset_url ? (
        <AudioRecordingPlayback
          durationSeconds={recording.duration ?? 0}
          mimeType={recording.mime_type}
          src={recording.asset_url}
          waveformData={recording.waveform_data}
        />
      ) : state.recording ? (
        <AudioRecordingPreview />
      ) : null}

      <AudioRecorderRecordingControls />
    </div>
  );
};
