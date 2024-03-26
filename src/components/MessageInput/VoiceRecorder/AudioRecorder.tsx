import React from 'react';
import {
  BinIcon,
  CheckSignIcon,
  LoadingIndicatorIcon,
  MicIcon,
  PauseIcon,
  SendIconV2,
} from '../icons';
import { AudioRecordingPreview } from './AudioRecordingPreview';
import { AudioRecordingInProgress } from './AudioRecordingInProgress';
import { useMessageInputContext } from '../../../context';
import { MediaRecordingState } from '../hooks/useMediaRecorder';
import { AttachmentUploadState } from '../types';
import { LoadState } from '../hooks/useTranscoding';

export const AudioRecorder = () => {
  const {
    voiceRecordingController: {
      cancelRecording,
      completeRecording,
      isTranscoding,
      pauseRecording,
      recordingState,
      resumeRecording,
      stopRecording,
      transcoderLoadState,
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
            {isUploadingFile || isTranscoding || transcoderLoadState === LoadState.LOADING ? (
              <LoadingIndicatorIcon />
            ) : (
              <SendIconV2 />
            )}
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
