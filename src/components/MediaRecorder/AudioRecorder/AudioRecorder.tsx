import React, { useMemo } from 'react';
import { AudioRecordingPreview } from './AudioRecordingPreview';
import { AudioRecordingInProgress } from './AudioRecordingInProgress';
import { MediaRecordingState } from '../classes';
import {
  BinIcon,
  CheckSignIcon,
  LoadingIndicatorIcon,
  MicIcon,
  PauseIcon,
  SendIcon,
} from '../../MessageInput';
import { useMessageInputContext } from '../../../context/MessageInputContext';

export const AudioRecorder = () => {
  const messageInputContext = useMessageInputContext();
  const {
    recordingController: { completeRecording, recorder, recording, recordingState },
  } = messageInputContext;

  const isUploadingFile = recording?.localMetadata?.uploadState === 'uploading';

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
    <div className='str-chat__audio_recorder-container'>
      <div className='str-chat__audio_recorder' data-testid={'audio-recorder'}>
        <button
          className='str-chat__audio_recorder__cancel-button'
          data-testid={'cancel-recording-audio-button'}
          disabled={isUploadingFile}
          onClick={recorder.cancel}
        >
          <BinIcon />
        </button>

        {state.stopped && recording?.asset_url ? (
          <AudioRecordingPreview
            durationSeconds={recording.duration ?? 0}
            mimeType={recording.mime_type}
            src={recording.asset_url}
            waveformData={recording.waveform_data}
          />
        ) : state.paused || state.recording ? (
          <AudioRecordingInProgress />
        ) : null}

        {state.paused && (
          <button
            className='str-chat__audio_recorder__resume-recording-button'
            onClick={recorder.resume}
          >
            <MicIcon />
          </button>
        )}
        {state.recording && (
          <button
            className='str-chat__audio_recorder__pause-recording-button'
            data-testid={'pause-recording-audio-button'}
            onClick={recorder.pause}
          >
            <PauseIcon />
          </button>
        )}
        {state.stopped ? (
          <button
            className='str-chat__audio_recorder__complete-button'
            data-testid='audio-recorder-complete-button'
            disabled={isUploadingFile}
            onClick={completeRecording}
          >
            {isUploadingFile ? <LoadingIndicatorIcon /> : <SendIcon />}
          </button>
        ) : (
          <button
            className='str-chat__audio_recorder__stop-button'
            data-testid='audio-recorder-stop-button'
            onClick={recorder.stop}
          >
            <CheckSignIcon />
          </button>
        )}
      </div>
    </div>
  );
};
