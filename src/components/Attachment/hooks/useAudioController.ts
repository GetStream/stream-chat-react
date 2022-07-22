import { useCallback, useEffect, useRef, useState } from 'react';

const progressUpdateInterval = 500;

export const useAudioController = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateProgress = useCallback(() => {
    if (!audioRef.current) return;

    const position = audioRef.current.currentTime;
    const { duration } = audioRef.current;
    const currentProgress = (100 / duration) * position;
    setProgress(currentProgress);

    if (position === duration) {
      setIsPlaying(false);
    }
  }, [audioRef]);

  const togglePlay = useCallback(() => {
    setIsPlaying((playing) => !playing);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play();
      const interval = setInterval(updateProgress, progressUpdateInterval);
      return () => clearInterval(interval);
    }
    audioRef.current.pause();

    return;
  }, [isPlaying, updateProgress]);

  return {
    audioRef,
    isPlaying,
    progress,
    togglePlay,
  };
};
