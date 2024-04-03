import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import type { RecordedMediaType } from '../../ReactFileUtilities';
import { useTranslationContext } from '../../../context';

export enum RecordingPermission {
  CAM = 'camera',
  MIC = 'microphone',
}

const MEDIA_TO_PERMISSION: Record<RecordedMediaType, RecordingPermission> = {
  audio: RecordingPermission.MIC,
  video: RecordingPermission.CAM,
};

export type PermissionNotGrantedHandler = (params: { permissionName: RecordingPermission }) => void;

type UseBrowserPermissionStateParams = {
  handleNotGrantedPermission?: PermissionNotGrantedHandler;
  mediaType?: RecordedMediaType | null;
  onError?: (e: Error, notificationText?: string) => void;
};

export const useBrowserPermissionState = ({
  handleNotGrantedPermission,
  mediaType,
  onError,
}: UseBrowserPermissionStateParams) => {
  const { t } = useTranslationContext('useBrowserPermissionState');
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>();
  const [permissionState, setPermissionState] = useState<PermissionState>();
  const permissionName = mediaType ? MEDIA_TO_PERMISSION[mediaType] : undefined;

  const checkPermissions = useCallback(async () => {
    if (!permissionName) {
      const notificationText = t('Unknown media recording permission');
      onError?.(new Error(t('Unknown media recording permission')), notificationText);
      return;
    }

    let permissionState;
    try {
      const permissionStatus = await navigator.permissions.query({
        name: (permissionName as unknown) as PermissionName,
      });
      permissionState = permissionStatus.state;
      setPermissionStatus(permissionStatus);
      setPermissionState(permissionState);
      if (permissionName && permissionState !== 'granted' && handleNotGrantedPermission) {
        handleNotGrantedPermission({ permissionName });
      }
    } catch (e) {
      // permission does not exist - cannot be queried
      // an example would be Firefox - camera, neither microphone perms can be queried
      permissionState = 'granted' as PermissionState;
      setPermissionState(permissionState);
    }
    return permissionState;
  }, [handleNotGrantedPermission, onError, permissionName, t]);

  useEffect(() => {
    if (!permissionStatus) return;
    const handlePermissionChange = (e: Event) => {
      const { state } = ((e as unknown) as ChangeEvent<PermissionStatus>).target;
      setPermissionState(state);
    };
    permissionStatus.addEventListener('change', handlePermissionChange);
    return () => {
      permissionStatus?.removeEventListener('change', handlePermissionChange);
    };
  }, [permissionStatus]);

  return { checkPermissions, permissionName, permissionState };
};
