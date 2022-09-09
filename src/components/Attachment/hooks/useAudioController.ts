import { useCallback, useEffect, useRef, useState } from 'react';

export const PROGRESS_UPDATE_INTERVAL = 100;

export const useAudioController = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = useCallback(() => {
    setIsPlaying((playing) => !playing);
  }, []);

  const seek = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    ({ clientX, currentTarget }) => {
      if (!audioRef.current) return;

      const { width, x } = currentTarget.getBoundingClientRect();

      const ratio = (clientX - x) / width;

      if (!isPlaying) setProgress(ratio * 100);

      audioRef.current.currentTime = ratio * audioRef.current.duration;
    },
    [isPlaying],
  );

  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;

    const interval = window.setInterval(() => {
      if (!audioRef.current) return;

      const { currentTime, duration } = audioRef.current;

      setProgress((currentTime / duration) * 100);

      if (currentTime === duration) setIsPlaying(false);
    }, PROGRESS_UPDATE_INTERVAL);

    audioRef.current.play();

    return () => {
      audioRef.current?.pause();

      window.clearInterval(interval);
    };
  }, [isPlaying]);

  return {
    audioRef,
    isPlaying,
    progress,
    seek,
    togglePlay,
  };
};
