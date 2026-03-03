import { CheckSignIcon, LoadingIndicatorIcon } from '../../MessageInput';
import { IconMicrophone, IconPause, IconTrashBin } from '../../Icons';
import React from 'react';
import { useMessageInputContext } from '../../../context';
import { isRecording } from './recordingStateIdentity';
import { Button } from '../../Button';

const ToggleRecordingButton = () => {
  const {
    recordingController: { recorder, recordingState },
  } = useMessageInputContext();

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
          appearance='ghost'
          circular
          className='str-chat__audio_recorder__cancel-button'
          data-testid={'cancel-recording-audio-button'}
          disabled={isUploadingFile}
          onClick={recorder.cancel}
          size='sm'
          variant='secondary'
        >
          <IconTrashBin />
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
