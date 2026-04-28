import { CheckSignIcon } from '../../MessageComposer/icons';
import { IconDelete, IconPauseFill, IconVoice } from '../../Icons';
import React from 'react';
import { useMessageComposerContext, useTranslationContext } from '../../../context';
import { isRecording } from './recordingStateIdentity';
import { Button } from '../../Button';
import { useNotificationApi } from '../../Notifications';
import { UploadProgressIndicator } from '../../Loading/UploadProgressIndicator';

const ToggleRecordingButton = () => {
  const { t } = useTranslationContext();
  const {
    recordingController: { recorder, recordingState },
  } = useMessageComposerContext();

  const recording = isRecording(recordingState);

  return (
    <Button
      appearance='outline'
      aria-label={recording ? t('aria/Pause recording') : t('aria/Resume recording')}
      circular
      className='str-chat__audio_recorder__toggle-recording-button'
      onClick={() => (recording ? recorder?.pause() : recorder?.resume())}
      size='sm'
      variant='secondary'
    >
      {recording ? <IconPauseFill /> : <IconVoice />}
    </Button>
  );
};

export const AudioRecorderRecordingControls = () => {
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const {
    recordingController: { completeRecording, recorder, recording, recordingState },
  } = useMessageComposerContext();
  const isUploadingFile = recording?.localMetadata?.uploadState === 'uploading';
  const uploadProgress = recording?.localMetadata?.uploadProgress;

  if (!recorder) return null;

  return (
    <div className='str-chat__audio_recorder__recording-controls'>
      {!isRecording(recordingState) && (
        <Button
          appearance='ghost'
          aria-label={t('aria/Cancel recording')}
          circular
          className='str-chat__audio_recorder__cancel-button'
          data-testid={'cancel-recording-audio-button'}
          disabled={isUploadingFile}
          onClick={() => {
            recorder.cancel();
            addNotification({
              emitter: 'AudioRecorder',
              message: t('Voice message deleted'),
              severity: 'info',
              type: 'audioRecording:cancel:success',
            });
          }}
          size='sm'
          variant='secondary'
        >
          <IconDelete />
        </Button>
      )}
      <ToggleRecordingButton />
      <Button
        appearance='solid'
        aria-label={t('aria/Complete recording')}
        circular
        className='str-chat__audio_recorder__stop-button'
        data-testid='audio-recorder-stop-button'
        onClick={completeRecording}
        size='sm'
        variant='primary'
      >
        {isUploadingFile ? (
          <UploadProgressIndicator uploadProgress={uploadProgress} />
        ) : (
          <CheckSignIcon />
        )}
      </Button>
    </div>
  );
};
