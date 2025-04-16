import { useCallback, useEffect, useRef, useState } from 'react';

type UseTimeElapsedParams = {
  startOnMount?: boolean;
};

// todo: provide start timestamp
export const useTimeElapsed = ({ startOnMount }: UseTimeElapsedParams = {}) => {
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const updateInterval = useRef<ReturnType<typeof setInterval>>(undefined);

  const startCounter = useCallback(() => {
    if (updateInterval.current) return;
    updateInterval.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopCounter = useCallback(() => {
    clearInterval(updateInterval.current);
    updateInterval.current = undefined;
  }, []);

  useEffect(() => {
    if (!startOnMount) return;
    startCounter();
    return () => {
      stopCounter();
    };
  }, [startCounter, startOnMount, stopCounter]);

  return {
    secondsElapsed,
    startCounter,
    stopCounter,
  };
};
