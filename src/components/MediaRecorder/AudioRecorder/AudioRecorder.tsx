import React from 'react';
import {
  BinIcon,
  CheckSignIcon,
  LoadingIndicatorIcon,
  MicIcon,
  PauseIcon,
  SendIconV2,
} from '../../MessageInput/icons';
import { AudioRecordingPreview } from './AudioRecordingPreview';
import { AudioRecordingInProgress } from './AudioRecordingInProgress';
import { useMessageInputContext } from '../../../context';
import { MediaRecordingState } from '../hooks/useMediaRecorder';
import { AttachmentUploadState } from '../../MessageInput/types';

export const AudioRecorder = () => {
  const {
    voiceRecordingController: {
      cancelRecording,
      completeRecording,
      pauseRecording,
      recordingState,
      resumeRecording,
      stopRecording,
      voiceRecording,
    },
  } = useMessageInputContext();

  const isUploadingFile =
    voiceRecording?.$internal?.uploadState === AttachmentUploadState.UPLOADING;
  return (
    <div className='str-chat__audio_recorder-container'>
      <div className='str-chat__audio_recorder'>
        <button
          className='str-chat__audio_recorder__cancel-button'
          disabled={isUploadingFile}
          onClick={cancelRecording}
        >
          <BinIcon />
        </button>

        {voiceRecording?.asset_url ? (
          <AudioRecordingPreview
            durationSeconds={voiceRecording.duration ?? 0}
            mimeType={voiceRecording.mime_type}
            src={voiceRecording.asset_url}
            waveformData={voiceRecording.waveform_data}
          />
        ) : (
          <AudioRecordingInProgress />
        )}

        {recordingState === MediaRecordingState.PAUSED && (
          <button
            className='str-chat__audio_recorder__resume-recording-button'
            onClick={resumeRecording}
          >
            <MicIcon />
          </button>
        )}
        {recordingState === MediaRecordingState.RECORDING && (
          <button
            className='str-chat__audio_recorder__pause-recording-button'
            onClick={pauseRecording}
          >
            <PauseIcon />
          </button>
        )}
        {recordingState === MediaRecordingState.STOPPED ? (
          <button
            className='str-chat__audio_recorder__complete-button'
            disabled={isUploadingFile}
            onClick={completeRecording}
          >
            {isUploadingFile ? <LoadingIndicatorIcon /> : <SendIconV2 />}
          </button>
        ) : (
          <button className='str-chat__audio_recorder__stop-button' onClick={stopRecording}>
            <CheckSignIcon />
          </button>
        )}
      </div>
    </div>
  );
};
