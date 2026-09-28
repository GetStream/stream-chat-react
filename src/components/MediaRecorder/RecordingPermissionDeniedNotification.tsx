import React from 'react';
import { useTranslationContext } from '../../context';
import type { RecordingPermission } from './classes/BrowserPermission';

export type RecordingPermissionDeniedNotificationProps = {
  permissionName: RecordingPermission;
};

export const RecordingPermissionDeniedNotification = ({
  permissionName,
}: RecordingPermissionDeniedNotificationProps) => {
  const { t } = useTranslationContext();
  const permissionTranslations = {
    body: {
      camera: t(
        'mediaRecorder.permissionDenied.camera.body',
        'To start recording, allow the camera access in your browser',
      ),
      microphone: t(
        'mediaRecorder.permissionDenied.microphone.body',
        'To start recording, allow the microphone access in your browser',
      ),
    },
    heading: {
      camera: t(
        'mediaRecorder.permissionDenied.camera.heading',
        'Allow access to camera',
      ),
      microphone: t(
        'mediaRecorder.permissionDenied.microphone.heading',
        'Allow access to microphone',
      ),
    },
  };

  return (
    <div className='str-chat__recording-permission-denied-notification'>
      <div className='str-chat__recording-permission-denied-notification__heading'>
        {permissionTranslations.heading[permissionName]}
      </div>
      <p className='str-chat__recording-permission-denied-notification__message'>
        {permissionTranslations.body[permissionName]}
      </p>
    </div>
  );
};
