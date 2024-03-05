import { useCallback, useEffect, useRef, useState } from 'react';
import { useChannelActionContext, useTranslationContext } from '../../../context';

export const elementIsPlaying = (audioElement: HTMLAudioElement | null) =>
  audioElement && !(audioElement.paused || audioElement.ended);

export const PROGRESS_UPDATE_INTERVAL = 100;

const DEFAULT_PLAYBACK_RATES = [1.0, 1.5, 2.0];

type AudioControllerParams = {
  /** Audio duration in seconds. */
  durationSeconds?: number;
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates?: number[];
};

export const useAudioController = (params: AudioControllerParams = {}) => {
  const { addNotification } = useChannelActionContext('useAudioController');
  const { t } = useTranslationContext('useAudioController');
  const { durationSeconds } = params;
  const playbackRates = params.playbackRates || DEFAULT_PLAYBACK_RATES;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(durationSeconds);
  const [playbackRateIndex, setPlaybackRateIndex] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playInterval = useRef<number>();

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    clearInterval(playInterval.current);
    if (!elementIsPlaying(audioRef.current)) {
      audioRef.current.play();

      playInterval.current = window.setInterval(() => {
        if (!audioRef.current) return;
        const { currentTime, duration } = audioRef.current;
        setProgress((currentTime / duration) * 100);
        setSecondsElapsed(currentTime);
      }, PROGRESS_UPDATE_INTERVAL);
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const increasePlaybackRate = useCallback(() => {
    setPlaybackRateIndex((prev) => {
      if (!audioRef.current) return prev;
      const nextIndex = prev === playbackRates.length - 1 ? 0 : prev + 1;
      audioRef.current.playbackRate = playbackRates[nextIndex];
      return nextIndex;
    });
  }, [playbackRates]);

  const seek = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    ({ clientX, currentTarget }) => {
      if (!audioRef.current) return;

      const { width, x } = currentTarget.getBoundingClientRect();

      const ratio = (clientX - x) / width;

      if (!elementIsPlaying(audioRef.current)) setProgress(ratio * 100);

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
      window.clearInterval(playInterval.current);
      setSecondsElapsed(durationSeconds);
      setIsPlaying(false);
    };
    audioElement.addEventListener('ended', handleEnded);

    const handleError = () => {
      addNotification(t<string>('Error reproducing the recording'), 'error');
    };
    audioElement.addEventListener('error', handleError);

    return () => {
      audioElement.pause();
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      window.clearInterval(playInterval.current);
    };
  }, [addNotification, durationSeconds, t]);

  return {
    audioRef,
    increasePlaybackRate,
    isPlaying,
    playbackRate: playbackRates[playbackRateIndex],
    progress,
    secondsElapsed,
    seek,
    togglePlay,
  };
};
