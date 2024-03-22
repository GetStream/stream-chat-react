import React from 'react';
import { useTranslationContext } from '../../context';
import { RecordingPermission } from './hooks/useMediaRecorder';

export type RecordingPermissionDeniedNotificationProps = {
  dismiss: () => void;
  permissionName: RecordingPermission;
};

export const RecordingPermissionDeniedNotification = ({
  dismiss,
  permissionName,
}: RecordingPermissionDeniedNotificationProps) => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__recording-permission-denied-notification'>
      <div className='str-chat__recording-permission-denied-notification__heading'>
        {t<string>('Allow {{name}}', { name: permissionName })}
      </div>
      <p className='str-chat__recording-permission-denied-notification__message'>
        {t<string>('To start recording, allow the {{name}} access in your browser', {
          name: permissionName,
        })}
      </p>
      <div className='str-chat__recording-permission-denied-notification__dismiss-button-container'>
        <button
          className='str-chat__recording-permission-denied-notification__dismiss-button'
          onClick={dismiss}
        >
          {t<string>('Ok')}
        </button>
      </div>
    </div>
  );
};
