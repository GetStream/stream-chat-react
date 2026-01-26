import React from 'react';
import { useTranslationContext } from '../../context';
import type { RecordingPermission } from './classes/BrowserPermission';
import { Button } from '../Button';
import clsx from 'clsx';

export type RecordingPermissionDeniedNotificationProps = {
  onClose: () => void;
  permissionName: RecordingPermission;
};

export const RecordingPermissionDeniedNotification = ({
  onClose,
  permissionName,
}: RecordingPermissionDeniedNotificationProps) => {
  const { t } = useTranslationContext();
  const permissionTranslations = {
    body: {
      camera: t('To start recording, allow the camera access in your browser'),
      microphone: t('To start recording, allow the microphone access in your browser'),
    },
    heading: {
      camera: t('Allow access to camera'),
      microphone: t('Allow access to microphone'),
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
      <div className='str-chat__recording-permission-denied-notification__dismiss-button-container'>
        <Button
          className={clsx(
            'str-chat__recording-permission-denied-notification__dismiss-button',
            'str-chat__button--ghost',
            'str-chat__button--secondary',
            'str-chat__button--size-md',
          )}
          onClick={onClose}
        >
          {t('Ok')}
        </Button>
      </div>
    </div>
  );
};
