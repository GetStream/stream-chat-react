import type { AudioPlayerPlugin } from './AudioPlayerPlugin';
import { type AudioPlayerErrorCode } from '../AudioPlayer';
import type { TFunction } from 'i18next';
import type { AddNotification } from '../../Notifications/hooks/useNotificationApi';
import type { NotificationTargetPanel } from '../../Notifications/notificationTarget';

export const audioPlayerNotificationsPluginFactory = ({
  addNotification,
  panel = 'channel',
  t,
}: {
  addNotification: AddNotification;
  panel?: NotificationTargetPanel;
  t: TFunction;
}): AudioPlayerPlugin => {
  const errors: Record<AudioPlayerErrorCode, Error> = {
    'failed-to-start': new Error(t('Failed to play the recording')),
    'not-playable': new Error(
      t('Recording format is not supported and cannot be reproduced'),
    ),
    'seek-not-supported': new Error(t('Cannot seek in the recording')),
  };

  return {
    id: 'AudioPlayerNotificationsPlugin',
    onError: ({ errCode, error: e }) => {
      const error =
        (errCode && errors[errCode]) ??
        e ??
        new Error(t('Error reproducing the recording'));

      addNotification({
        emitter: 'AudioPlayer',
        error,
        message: error.message,
        severity: 'error',
        targetPanels: [panel],
        type: 'browser:audio:playback:error',
      });
    },
  };
};
