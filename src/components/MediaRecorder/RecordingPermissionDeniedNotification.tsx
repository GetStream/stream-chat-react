import React, { useState } from 'react';
import { useTranslationContext } from '../../context';

import { RecordingPermission } from './classes/BrowserPermission';

export type RecordingPermissionDeniedNotificationProps = {
  permissionName: RecordingPermission;
};

export const RecordingPermissionDeniedNotification = ({
  permissionName,
}: RecordingPermissionDeniedNotificationProps) => {
  const { t } = useTranslationContext();
  const [show, setShow] = useState(true);
  if (!show) return null;

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
          onClick={() => setShow(false)}
        >
          {t<string>('Ok')}
        </button>
      </div>
    </div>
  );
};
