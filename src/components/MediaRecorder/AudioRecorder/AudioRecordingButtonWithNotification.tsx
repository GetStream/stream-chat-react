import { StartRecordingAudioButton as DefaultStartRecordingAudioButton } from './AudioRecordingButtons';
import { RecordingAttachmentType, RecordingPermission } from '../classes';
import { RecordingPermissionDeniedNotification as DefaultRecordingPermissionDeniedNotification } from '../RecordingPermissionDeniedNotification';
import React, { useRef } from 'react';
import { useAttachmentManagerState } from '../../MessageInput';
import { useComponentContext, useMessageInputContext } from '../../../context';
import { DialogAnchor, useDialogIsOpen, useDialogOnNearestManager } from '../../Dialog';

const dialogId = 'recording-permission-denied-notification';

export const AudioRecordingButtonWithNotification = () => {
  const {
    RecordingPermissionDeniedNotification = DefaultRecordingPermissionDeniedNotification,
    StartRecordingAudioButton = DefaultStartRecordingAudioButton,
  } = useComponentContext();
  const { asyncMessagesMultiSendEnabled, recordingController } = useMessageInputContext();
  const { attachments } = useAttachmentManagerState();

  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

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
      <DialogAnchor
        dialogManagerId={dialogManager?.id}
        id={dialogId}
        referenceElement={audioRecordingBtnRef.current}
      >
        {dialogIsOpen && (
          <RecordingPermissionDeniedNotification
            onClose={dialog.close}
            permissionName={RecordingPermission.MIC}
          />
        )}
      </DialogAnchor>
    </>
  );
};
