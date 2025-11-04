import throttle from 'lodash.throttle';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChannelActionContext, useTranslationContext } from '../../../context';

const isSeekable = (audioElement: HTMLAudioElement) =>
  !(audioElement.duration === Infinity || isNaN(audioElement.duration));

export const elementIsPlaying = (audioElement: HTMLAudioElement | null) =>
  audioElement && !(audioElement.paused || audioElement.ended);

const logError = (e: Error) => console.error('[AUDIO PLAYER]', e);

const DEFAULT_PLAYBACK_RATES = [1.0, 1.5, 2.0];

export type SeekFn = (params: { clientX: number; currentTarget: HTMLDivElement }) => void;

type AudioControllerParams = {
  /** Audio duration in seconds. */
  durationSeconds?: number;
  /** The audio MIME type that is checked before the audio is played. If the type is not supported the controller registers error in playbackError. */
  mimeType?: string;
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates?: number[];
};

/** @deprecated use useAudioPlayer instead */
export const useAudioController = ({
  durationSeconds,
  mimeType,
  playbackRates = DEFAULT_PLAYBACK_RATES,
}: AudioControllerParams = {}) => {
  const { addNotification } = useChannelActionContext('useAudioController');
  const { t } = useTranslationContext('useAudioController');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState<Error>();
  const [canPlayRecord, setCanPlayRecord] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [playbackRateIndex, setPlaybackRateIndex] = useState<number>(0);
  const playTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const registerError = useCallback(
    (e: Error) => {
      logError(e as Error);
      setPlaybackError(e);
      addNotification(e.message, 'error');
    },
    [addNotification],
  );

  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;
    clearTimeout(playTimeout.current);
    playTimeout.current = undefined;
    if (mimeType && !audioRef.current.canPlayType(mimeType)) {
      registerError(
        new Error(t('Recording format is not supported and cannot be reproduced')),
      );
      setCanPlayRecord(false);
      return;
    }
    if (elementIsPlaying(audioRef.current)) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playTimeout.current = setTimeout(() => {
        if (!audioRef.current) return;
        try {
          audioRef.current.pause();
          setIsPlaying(false);
        } catch (e) {
          registerError(new Error(t('Failed to play the recording')));
        }
      }, 2000);

      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        registerError(e as Error);
        setIsPlaying(false);
      } finally {
        clearTimeout(playTimeout.current);
        playTimeout.current = undefined;
      }
    }
  }, [mimeType, registerError, t]);

  const increasePlaybackRate = () => {
    setPlaybackRateIndex((prev) => {
      if (!audioRef.current) return prev;
      const nextIndex = prev === playbackRates.length - 1 ? 0 : prev + 1;
      audioRef.current.playbackRate = playbackRates[nextIndex];
      return nextIndex;
    });
  };

  const seek = useMemo<SeekFn>(
    () =>
      throttle(({ clientX, currentTarget }) => {
        if (!(currentTarget && audioRef.current)) return;
        if (!isSeekable(audioRef.current)) {
          registerError(new Error(t('Cannot seek in the recording')));
          return;
        }

        const { width, x } = currentTarget.getBoundingClientRect();

        const ratio = (clientX - x) / width;
        if (ratio > 1 || ratio < 0) return;
        const currentTime = ratio * audioRef.current.duration;
        setSecondsElapsed(currentTime);
        audioRef.current.currentTime = currentTime;
      }, 16),
    [registerError, t],
  );

  useEffect(() => {
    if (!audioRef.current) return;
    const audioElement = audioRef.current;

    const handleEnded = () => {
      setSecondsElapsed(audioElement?.duration ?? durationSeconds ?? 0);
      setIsPlaying(false);
    };
    audioElement.addEventListener('ended', handleEnded);

    const handleError = () => {
      addNotification(t('Error reproducing the recording'), 'error');
      setIsPlaying(false);
    };
    audioElement.addEventListener('error', handleError);

    const handleTimeupdate = () => {
      setSecondsElapsed(audioElement?.currentTime);
    };
    audioElement.addEventListener('timeupdate', handleTimeupdate);

    return () => {
      audioElement.pause();
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('timeupdate', handleTimeupdate);
    };
  }, [addNotification, durationSeconds, t]);

  return {
    audioRef,
    canPlayRecord,
    increasePlaybackRate,
    isPlaying,
    playbackError,
    playbackRate: playbackRates[playbackRateIndex],
    progress:
      audioRef.current && secondsElapsed
        ? (secondsElapsed / audioRef.current.duration) * 100
        : 0,
    secondsElapsed,
    seek,
    togglePlay,
  };
};
