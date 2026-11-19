import React, { useContext, useEffect, useRef, useState } from 'react';
import type { AudioPlayerOptions } from './AudioPlayer';
import type { AudioPlayerPoolState } from './AudioPlayerPool';
import { AudioPlayerPool } from './AudioPlayerPool';
import { AudioPlaybackArbiter } from './AudioPlaybackArbiter';
import { audioPlayerNotificationsPluginFactory } from './plugins/AudioPlayerNotificationsPlugin';
import { useNotificationApi, useNotificationTarget } from '../Notifications';
import { useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import { useAudioPlaybackChangeAnnouncements } from '../Accessibility/hooks/useAudioPlaybackChangeAnnouncements';

export type WithAudioPlaybackProps = {
  children?: React.ReactNode;
  /**
   * What the playback belongs to. When it changes, every player this provider started is stopped
   * and discarded. Needed because a provider is not always unmounted when its subject changes
   * (`Channel` stays mounted across a channel switch).
   */
  playbackScope?: unknown;
};

const AudioPlayerContext = React.createContext<{ audioPlayers: AudioPlayerPool | null }>({
  audioPlayers: null,
});

/**
 * The arbiter every pool below shares, so no two surfaces play at once. `Chat` provides one; a
 * `WithAudioPlayback` mounted outside a `Chat` falls back to a pool that arbitrates alone.
 */
const SharedAudioPlaybackContext = React.createContext<AudioPlaybackArbiter | null>(null);

export const SharedAudioPlaybackProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const [arbiter] = useState(() => new AudioPlaybackArbiter());
  return (
    <SharedAudioPlaybackContext.Provider value={arbiter}>
      {children}
    </SharedAudioPlaybackContext.Provider>
  );
};

export const WithAudioPlayback = ({
  children,
  playbackScope,
}: WithAudioPlaybackProps) => {
  const arbiter = useContext(SharedAudioPlaybackContext);
  const [audioPlayers] = useState(
    () => new AudioPlayerPool({ arbiter: arbiter ?? undefined }),
  );

  // Runs on unmount and whenever the scope changes: the players belong to the scope, not to this
  // provider's lifetime.
  useEffect(
    () => () => {
      audioPlayers.clear();
    },
    [audioPlayers, playbackScope],
  );

  return (
    <AudioPlayerContext.Provider value={{ audioPlayers }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export type UseAudioPlayerProps = {
  /**
   * Entity that requested the playback, e.g. a message ID. The player ID is `requester:src`,
   * because a URL can back several UI elements and an element can show several sources. Requests
   * with the same requester and URL (a message with duplicate attachments) share one player.
   */
  requester?: string;
} & Partial<Omit<AudioPlayerOptions, 'id' | 'pool'>>;

const makeAudioPlayerId = ({ requester, src }: { src: string; requester?: string }) =>
  `${requester ?? 'requester-unknown'}:${src}`;

/**
 * Whether `src` is `previousSrc` re-signed: the same origin and path, only the query differs (e.g. a
 * CDN URL with a new expiry and signature).
 */
const isResignedUrl = (previousSrc: string, src: string) => {
  try {
    const previous = new URL(previousSrc);
    const next = new URL(src);
    return previous.origin === next.origin && previous.pathname === next.pathname;
  } catch {
    return false;
  }
};

/**
 * Whether `src` gives the audio `previousSrc` played a new address rather than naming other audio:
 * an upload's URL replacing the local object URL (`blob:`) of the file being uploaded, or a
 * re-signed URL of the same file.
 */
const isSameAudioAtNewSource = (
  previousSrc: string | undefined,
  src: string | undefined,
): previousSrc is string =>
  !!previousSrc &&
  !!src &&
  previousSrc !== src &&
  (previousSrc.startsWith('blob:') || isResignedUrl(previousSrc, src));

export const useAudioPlayer = ({
  durationSeconds,
  fileSize,
  mimeType,
  playbackRates,
  plugins,
  requester = '',
  src,
  title,
  waveformData,
}: UseAudioPlayerProps) => {
  const { addNotification } = useNotificationApi();
  const panel = useNotificationTarget();
  const { t } = useTranslationContext();
  const { audioPlayers } = useContext(AudioPlayerContext);
  const previousSrc = useRef(src);

  // A widget whose audio moves to a new address keeps its player, so playback carries on rather
  // than a second, idle player taking its place in the widget.
  const replacedSrc = previousSrc.current;
  if (src && audioPlayers && isSameAudioAtNewSource(replacedSrc, src)) {
    audioPlayers.rekey(
      makeAudioPlayerId({ requester, src: replacedSrc }),
      makeAudioPlayerId({ requester, src }),
    );
  }

  useEffect(() => {
    previousSrc.current = src;
  }, [src]);

  const audioPlayer =
    src && audioPlayers
      ? audioPlayers.getOrAdd({
          durationSeconds,
          fileSize,
          id: makeAudioPlayerId({ requester, src }),
          mimeType,
          playbackRates,
          plugins,
          src,
          title,
          waveformData,
        })
      : undefined;

  useAudioPlaybackChangeAnnouncements(audioPlayer);

  useEffect(() => {
    if (!audioPlayer) return;
    // A plugin produces the translated notifications, so AudioPlayer needs neither the client nor
    // the translation function.
    const notificationsPlugin = audioPlayerNotificationsPluginFactory({
      addNotification,
      panel,
      t,
    });
    audioPlayer.setPlugins((currentPlugins) => [
      ...currentPlugins.filter((plugin) => plugin.id !== notificationsPlugin.id),
      notificationsPlugin,
    ]);
  }, [addNotification, audioPlayer, panel, t]);

  return audioPlayer;
};

const activeAudioPlayerSelector = ({ activeAudioPlayer }: AudioPlayerPoolState) => ({
  activeAudioPlayer,
});

export const useActiveAudioPlayer = () => {
  const { audioPlayers } = useContext(AudioPlayerContext);
  const { activeAudioPlayer } =
    useStateStore(audioPlayers?.state, activeAudioPlayerSelector) ?? {};
  return activeAudioPlayer;
};
