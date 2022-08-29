import React, { useEffect, useState } from 'react';

export type CooldownTimerProps = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
};
export const CooldownTimer = ({ cooldownInterval, setCooldownRemaining }: CooldownTimerProps) => {
  const [seconds, setSeconds] = useState(cooldownInterval);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      } else {
        setCooldownRemaining(0);
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  });

  return (
    <div className='str-chat__message-input-cooldown' data-testid='cooldown-timer'>
      {seconds === 0 ? null : seconds}
    </div>
  );
};
