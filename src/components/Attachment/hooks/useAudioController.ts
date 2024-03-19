import { useCallback, useEffect, useRef, useState } from 'react';
import { useChannelActionContext, useTranslationContext } from '../../../context';

export const elementIsPlaying = (audioElement: HTMLAudioElement | null) =>
  audioElement && !(audioElement.paused || audioElement.ended);

const DEFAULT_PLAYBACK_RATES = [1.0, 1.5, 2.0];

type AudioControllerParams = {
  /** Audio duration in seconds. */
  durationSeconds?: number;
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates?: number[];
};

export const useAudioController = ({
  durationSeconds,
  playbackRates = DEFAULT_PLAYBACK_RATES,
}: AudioControllerParams = {}) => {
  const { addNotification } = useChannelActionContext('useAudioController');
  const { t } = useTranslationContext('useAudioController');
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [playbackRateIndex, setPlaybackRateIndex] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (!elementIsPlaying(audioRef.current)) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const increasePlaybackRate = () => {
    setPlaybackRateIndex((prev) => {
      if (!audioRef.current) return prev;
      const nextIndex = prev === playbackRates.length - 1 ? 0 : prev + 1;
      audioRef.current.playbackRate = playbackRates[nextIndex];
      return nextIndex;
    });
  };

  const seek = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    ({ clientX, currentTarget }) => {
      if (!audioRef.current) return;

      const { width, x } = currentTarget.getBoundingClientRect();

      const ratio = (clientX - x) / width;

      const currentTime = ratio * audioRef.current.duration;
      setSecondsElapsed(currentTime);
      audioRef.current.currentTime = currentTime;
    },
    [],
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
      addNotification(t<string>('Error reproducing the recording'), 'error');
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
    increasePlaybackRate,
    isPlaying,
    playbackRate: playbackRates[playbackRateIndex],
    progress:
      audioRef.current && secondsElapsed ? (secondsElapsed / audioRef.current.duration) * 100 : 0,
    secondsElapsed,
    seek,
    togglePlay,
  };
};
