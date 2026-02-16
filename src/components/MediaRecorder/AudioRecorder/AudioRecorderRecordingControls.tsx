import { CheckSignIcon, LoadingIndicatorIcon } from '../../MessageInput';
import { IconMicrophone, IconPause, IconTrashBin } from '../../Icons';
import React from 'react';
import { useMessageInputContext } from '../../../context';
import { isRecording } from './recordingStateIdentity';
import { Button } from '../../Button';
import clsx from 'clsx';

const ToggleRecordingButton = () => {
  const {
    recordingController: { recorder, recordingState },
  } = useMessageInputContext();

  return (
    <Button
      className={clsx(
        'str-chat__audio_recorder__toggle-recording-button',
        'str-chat__button--secondary',
        'str-chat__button--outline',
        'str-chat__button--size-sm',
        'str-chat__button--circular',
      )}
      onClick={() =>
        isRecording(recordingState) ? recorder?.pause() : recorder?.resume()
      }
    >
      {isRecording(recordingState) ? <IconPause /> : <IconMicrophone />}
    </Button>
  );
};

export const AudioRecorderRecordingControls = () => {
  const {
    recordingController: { completeRecording, recorder, recording, recordingState },
  } = useMessageInputContext();
  const isUploadingFile = recording?.localMetadata?.uploadState === 'uploading';

  if (!recorder) return null;

  return (
    <div className='str-chat__audio_recorder__recording-controls'>
      {!isRecording(recordingState) && (
        <Button
          className={clsx(
            'str-chat__audio_recorder__cancel-button',
            'str-chat__button--secondary',
            'str-chat__button--ghost',
            'str-chat__button--size-sm',
            'str-chat__button--circular',
          )}
          data-testid={'cancel-recording-audio-button'}
          disabled={isUploadingFile}
          onClick={recorder.cancel}
        >
          <IconTrashBin />
        </Button>
      )}
      <ToggleRecordingButton />
      <Button
        className={clsx(
          'str-chat__audio_recorder__stop-button',
          'str-chat__button--solid',
          'str-chat__button--primary',
          'str-chat__button--size-sm',
          'str-chat__button--circular',
        )}
        data-testid='audio-recorder-stop-button'
        onClick={completeRecording}
      >
        {isUploadingFile ? <LoadingIndicatorIcon /> : <CheckSignIcon />}
      </Button>
    </div>
  );
};
