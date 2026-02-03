import { RecordingAttachmentType, RecordingPermission } from '../classes';
import { RecordingPermissionDeniedNotification as DefaultRecordingPermissionDeniedNotification } from '../RecordingPermissionDeniedNotification';
import React, { forwardRef, useRef } from 'react';
import { useAttachmentManagerState } from '../../MessageInput';
import { useComponentContext, useMessageInputContext } from '../../../context';
import { Callout, useDialogOnNearestManager } from '../../Dialog';
import { Button } from '../../Button';
import clsx from 'clsx';
import { IconMicrophone } from '../../Icons';

const dialogId = 'recording-permission-denied-notification';

export const AudioRecordingButtonWithNotification = () => {
  const {
    RecordingPermissionDeniedNotification = DefaultRecordingPermissionDeniedNotification,
    StartRecordingAudioButton = DefaultStartRecordingAudioButton,
  } = useComponentContext();
  const { asyncMessagesMultiSendEnabled, recordingController } = useMessageInputContext();
  const { attachments } = useAttachmentManagerState();

  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });

  const audioRecordingBtnRef = useRef<HTMLButtonElement | null>(null);
  const isRecording = !!recordingController.recordingState;

  return (
    <>
      <StartRecordingAudioButton
        disabled={
          isRecording ||
          (!asyncMessagesMultiSendEnabled &&
            attachments.some((a) => a.type === RecordingAttachmentType.VOICE_RECORDING))
        }
        onClick={() => {
          recordingController.recorder?.start();

          const recordingEnabled = !!(
            recordingController.recorder && navigator.mediaDevices
          );

          const shouldShowNotification =
            recordingEnabled && recordingController.permissionState === 'denied';
          if (shouldShowNotification) dialog.open();
        }}
        ref={audioRecordingBtnRef}
      />
      <Callout
        className='str-chat__recording-permission-denied-notification'
        dialogManagerId={dialogManager?.id}
        id={dialogId}
        onClose={dialog.close}
        placement={'top-start'}
        referenceElement={audioRecordingBtnRef.current}
      >
        <RecordingPermissionDeniedNotification permissionName={RecordingPermission.MIC} />
      </Callout>
    </>
  );
};

export type StartRecordingAudioButtonProps = React.ComponentProps<'button'>;

export const DefaultStartRecordingAudioButton = forwardRef<
  HTMLButtonElement,
  StartRecordingAudioButtonProps
>(function StartRecordingAudioButton(props, ref) {
  return (
    <Button
      aria-label='Start recording audio'
      className={clsx(
        'str-chat__start-recording-audio-button',
        'str-chat__button--ghost',
        'str-chat__button--secondary',
        'str-chat__button--size-sm',
        'str-chat__button--circular',
      )}
      data-testid='start-recording-audio-button'
      {...props}
      ref={ref}
    >
      <IconMicrophone />
    </Button>
  );
});
