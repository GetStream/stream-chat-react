import { useCallback, useEffect, useRef, useState } from 'react';

type UseTimeElapsedParams = {
  startOnMount?: boolean;
};

// todo: provide start timestamp
export const useTimeElapsed = ({ startOnMount }: UseTimeElapsedParams = {}) => {
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const updateInterval = useRef<ReturnType<typeof setInterval>>();

  const startCounter = useCallback(() => {
    updateInterval.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopCounter = useCallback(() => {
    clearInterval(updateInterval.current);
  }, []);

  useEffect(() => {
    if (!startOnMount) return;
    updateInterval.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      stopCounter();
    };
  }, [startOnMount, stopCounter]);

  return {
    secondsElapsed,
    startCounter,
    stopCounter,
  };
};
