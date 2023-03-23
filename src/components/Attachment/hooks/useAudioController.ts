import { useCallback, useEffect, useRef, useState } from 'react';

export const PROGRESS_UPDATE_INTERVAL = 100;

const DEFAULT_PLAYBACK_RATES = [1.0, 1.5, 2.0];

type AudioControllerParams = {
  durationSeconds?: number;
  playbackRates?: number[];
};

export const useAudioController = (params: AudioControllerParams = {}) => {
  const { durationSeconds } = params;
  const playbackRates = params.playbackRates || DEFAULT_PLAYBACK_RATES;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(durationSeconds);
  const [playbackRateIndex, setPlaybackRateIndex] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = useCallback(() => {
    setIsPlaying((playing) => !playing);
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

      if (!isPlaying) {
        setProgress(ratio * 100);
      }

      const currentTime = ratio * audioRef.current.duration;
      setSecondsElapsed(currentTime);
      audioRef.current.currentTime = currentTime;
    },
    [isPlaying],
  );

  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;

    const interval = window.setInterval(() => {
      if (!audioRef.current) return;

      const { currentTime, duration } = audioRef.current;
      setProgress((currentTime / duration) * 100);

      if (currentTime === duration) {
        setIsPlaying(false);
        setSecondsElapsed(duration);
      } else {
        setSecondsElapsed(currentTime);
      }
    }, PROGRESS_UPDATE_INTERVAL);

    audioRef.current.play();

    return () => {
      audioRef.current?.pause();

      window.clearInterval(interval);
    };
  }, [isPlaying]);

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
