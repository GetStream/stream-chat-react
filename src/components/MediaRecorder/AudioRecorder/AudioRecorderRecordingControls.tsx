import { CheckSignIcon } from '../../MessageComposer/icons';
import { IconDelete, IconPauseFill, IconVoice } from '../../Icons';
import React from 'react';
import {
  useChatContext,
  useMessageComposerContext,
  useTranslationContext,
} from '../../../context';
import { isRecording } from './recordingStateIdentity';
import { Button } from '../../Button';
import { addNotificationTargetTag, useNotificationTarget } from '../../Notifications';
import { AttachmentUploadProgressIndicator } from '../../MessageComposer/AttachmentPreviewList/AttachmentUploadProgressIndicator';

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
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const {
    recordingController: { completeRecording, recorder, recording, recordingState },
  } = useMessageComposerContext();
  const panel = useNotificationTarget();

  const isUploadingFile = recording?.localMetadata?.uploadState === 'uploading';
  const uploadProgress = recording?.localMetadata?.uploadProgress;

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
            client.notifications.addInfo({
              message: t('Voice message deleted'),
              options: {
                tags: addNotificationTargetTag(panel),
                type: 'audioRecording:cancel:success',
              },
              origin: { emitter: 'AudioRecorder' },
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
        {isUploadingFile ? (
          <AttachmentUploadProgressIndicator uploadProgress={uploadProgress} />
        ) : (
          <CheckSignIcon />
        )}
      </Button>
    </div>
  );
};
