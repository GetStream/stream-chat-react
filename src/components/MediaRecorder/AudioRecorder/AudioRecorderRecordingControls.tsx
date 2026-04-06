import { CheckSignIcon, LoadingIndicatorIcon } from '../../MessageComposer/icons';
import { IconDelete, IconPauseFill, IconVoice } from '../../Icons';
import React from 'react';
import { useMessageComposerContext, useTranslationContext } from '../../../context';
import { isRecording } from './recordingStateIdentity';
import { Button } from '../../Button';
import { useNotificationApi } from '../../Notifications';

const ToggleRecordingButton = () => {
  const {
    recordingController: { recorder, recordingState },
  } = useMessageComposerContext();

  return (
    <Button
      appearance='outline'
      circular
      className='str-chat__audio_recorder__toggle-recording-button'
      onClick={() =>
        isRecording(recordingState) ? recorder?.pause() : recorder?.resume()
      }
      size='sm'
      variant='secondary'
    >
      {isRecording(recordingState) ? <IconPauseFill /> : <IconVoice />}
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

  if (!recorder) return null;

  return (
    <div className='str-chat__audio_recorder__recording-controls'>
      {!isRecording(recordingState) && (
        <Button
          appearance='ghost'
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
        circular
        className='str-chat__audio_recorder__stop-button'
        data-testid='audio-recorder-stop-button'
        onClick={completeRecording}
        size='sm'
        variant='primary'
      >
        {isUploadingFile ? <LoadingIndicatorIcon /> : <CheckSignIcon />}
      </Button>
    </div>
  );
};
