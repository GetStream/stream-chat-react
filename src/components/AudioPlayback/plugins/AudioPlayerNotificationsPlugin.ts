import type { AudioPlayerPlugin } from './AudioPlayerPlugin';
import { type AudioPlayerErrorCode } from '../AudioPlayer';
import type { TFunction } from 'i18next';
import type { AddNotification } from '../../Notifications/hooks/useNotificationApi';
import type { NotificationTargetPanel } from '../../Notifications/notificationTarget';

const SEEK_NOT_SUPPORTED_NOTIFICATION_DEBOUNCE_INTERVAL_MS = 1000;

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
  let lastSeekNotSupportedNotificationAt: number | undefined;

  return {
    id: 'AudioPlayerNotificationsPlugin',
    onError: ({ errCode, error: e }) => {
      if (errCode === 'seek-not-supported') {
        const now = Date.now();

        if (
          typeof lastSeekNotSupportedNotificationAt === 'number' &&
          now - lastSeekNotSupportedNotificationAt <
            SEEK_NOT_SUPPORTED_NOTIFICATION_DEBOUNCE_INTERVAL_MS
        ) {
          return;
        }

        lastSeekNotSupportedNotificationAt = now;
      }

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
