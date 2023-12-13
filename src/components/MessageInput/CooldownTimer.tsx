import React, { useEffect, useState } from 'react';

export type CooldownTimerProps = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
};
export const CooldownTimer = ({ cooldownInterval }: CooldownTimerProps) => {
  const [seconds, setSeconds] = useState<number | undefined>();

  useEffect(() => {
    let countdownTimeout: ReturnType<typeof setTimeout>;
    if (typeof seconds === 'number' && seconds > 0) {
      countdownTimeout = setTimeout(() => {
        setSeconds(seconds - 1);
      }, 1000);
    }
    return () => {
      clearTimeout(countdownTimeout);
    };
  }, [seconds]);

  useEffect(() => {
    setSeconds(cooldownInterval ?? 0);
  }, [cooldownInterval]);

  return (
    <div className='str-chat__message-input-cooldown' data-testid='cooldown-timer'>
      {seconds}
    </div>
  );
};
