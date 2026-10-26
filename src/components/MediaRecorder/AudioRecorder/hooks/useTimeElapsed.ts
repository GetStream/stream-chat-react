import { useCallback, useEffect, useRef, useState } from 'react';

type UseTimeElapsedParams = {
  initialSeconds?: number;
  startOnMount?: boolean;
};

// todo: provide start timestamp
export const useTimeElapsed = ({
  initialSeconds = 0,
  startOnMount,
}: UseTimeElapsedParams = {}) => {
  const [secondsElapsed, setSecondsElapsed] = useState<number>(initialSeconds);
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
    if (updateInterval.current) return;
    setSecondsElapsed(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!startOnMount) return;
    startCounter();
    return () => {
      stopCounter();
    };
  }, [startCounter, startOnMount, stopCounter]);

  // The counter can also be started through startCounter(), so stop it on unmount too
  useEffect(() => stopCounter, [stopCounter]);

  return {
    secondsElapsed,
    startCounter,
    stopCounter,
  };
};
