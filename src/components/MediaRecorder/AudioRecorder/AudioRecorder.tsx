import React from 'react';
import { AudioRecordingPreview } from './AudioRecordingPreview';
import { AudioRecordingInProgress } from './AudioRecordingInProgress';
import { MediaRecordingState } from '../classes';
import {
  BinIcon,
  CheckSignIcon,
  LoadingIndicatorIcon,
  MicIcon,
  PauseIcon,
  SendIconV2,
} from '../../MessageInput';
import { useMessageInputContext } from '../../../context';

export const AudioRecorder = () => {
  const {
    recordingController: { completeRecording, recorder, recording, recordingState },
  } = useMessageInputContext();

  const isUploadingFile = recording?.$internal?.uploadState === 'uploading';

  if (!recorder) return null;

  return (
    <div className='str-chat__audio_recorder-container'>
      <div className='str-chat__audio_recorder' data-testid={'audio-recorder'}>
        <button
          className='str-chat__audio_recorder__cancel-button'
          disabled={isUploadingFile}
          onClick={recorder.cancel}
        >
          <BinIcon />
        </button>

        {recording?.asset_url ? (
          <AudioRecordingPreview
            durationSeconds={recording.duration ?? 0}
            mimeType={recording.mime_type}
            src={recording.asset_url}
            waveformData={recording.waveform_data}
          />
        ) : (
          <AudioRecordingInProgress />
        )}

        {recordingState === MediaRecordingState.PAUSED && (
          <button
            className='str-chat__audio_recorder__resume-recording-button'
            onClick={recorder.resume}
          >
            <MicIcon />
          </button>
        )}
        {recordingState === MediaRecordingState.RECORDING && (
          <button
            className='str-chat__audio_recorder__pause-recording-button'
            onClick={recorder.pause}
          >
            <PauseIcon />
          </button>
        )}
        {recordingState === MediaRecordingState.STOPPED ? (
          <button
            className='str-chat__audio_recorder__complete-button'
            data-testid='audio-recorder-complete-button'
            disabled={isUploadingFile}
            onClick={completeRecording}
          >
            {isUploadingFile ? <LoadingIndicatorIcon /> : <SendIconV2 />}
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
