import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import type { AudioPlayerOptions } from './AudioPlayer';
import { AudioPlayerPool } from './AudioPlayerPool';
import { audioPlayerNotificationsPluginFactory } from './plugins/AudioPlayerNotificationsPlugin';
import { useChatContext, useTranslationContext } from '../../context';

const audioPlayers = new AudioPlayerPool();

export type WithAudioPlaybackProps = { children?: ReactNode };

export const WithAudioPlayback = ({ children }: WithAudioPlaybackProps) => {
  useEffect(
    () => () => {
      audioPlayers.clear();
    },
    [],
  );

  return children;
};

export type UseAudioPlayerProps = {
  /**
   * Identifier of the entity that requested the audio playback, e.g. message ID.
   * Asset to specific audio player is a many-to-many relationship
   * - one URL can be associated with multiple UI elements,
   * - one UI element can display multiple audio sources.
   * Therefore, the AudioPlayer ID is a combination of request:src.
   *
   * The requester string can take into consideration whether there are multiple instances of
   * the same URL requested by the same requester (message has multiple attachments with the same asset URL).
   * In reality the fact that one message has multiple attachments with the same asset URL
   * could be considered a bad practice or a bug.
   */
  requester?: string;
} & Partial<Omit<AudioPlayerOptions, 'id'>>;

const makeAudioPlayerId = ({ requester, src }: { src: string; requester?: string }) =>
  `${requester ?? 'requester-unknown'}:${src}`;

export const useAudioPlayer = ({
  durationSeconds,
  mimeType,
  playbackRates,
  plugins,
  requester = '',
  src,
}: UseAudioPlayerProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  const audioPlayer = useMemo(
    () =>
      src
        ? audioPlayers.getOrAdd({
            durationSeconds,
            id: makeAudioPlayerId({ requester, src }),
            mimeType,
            playbackRates,
            plugins,
            src,
          })
        : undefined,
    [durationSeconds, mimeType, playbackRates, plugins, requester, src],
  );

  useEffect(() => {
    if (!audioPlayer) return;
    /**
     * Avoid having to pass client and translation function to AudioPlayer instances
     * and instead provide plugin that takes care of translated notifications.
     */
    const notificationsPlugin = audioPlayerNotificationsPluginFactory({ client, t });
    audioPlayer.setPlugins((currentPlugins) => [
      ...currentPlugins.filter((plugin) => plugin.id !== notificationsPlugin.id),
      notificationsPlugin,
    ]);
  }, [audioPlayer, client, t]);

  return audioPlayer;
};
