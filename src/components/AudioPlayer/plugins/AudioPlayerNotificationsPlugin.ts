import type { AudioPlayerPlugin } from './AudioPlayerPlugin';
import { type AudioPlayerErrorCode } from '../AudioPlayer';
import type { StreamChat } from 'stream-chat';
import type { TFunction } from 'i18next';

export const audioPlayerNotificationsPluginFactory = ({
  client,
  t,
}: {
  client: StreamChat;
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

      client?.notifications.addError({
        message: error.message,
        options: {
          originalError: error,
          type: 'browser:audio:playback:error',
        },
        origin: {
          emitter: 'AudioPlayer',
        },
      });
    },
  };
};
