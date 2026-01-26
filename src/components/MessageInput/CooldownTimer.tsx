import React from 'react';
import { useTimer } from './hooks/useTimer';

export type CooldownTimerProps = {
  cooldownInterval: number;
};
export const CooldownTimer = ({ cooldownInterval }: CooldownTimerProps) => {
  const secondsLeft = useTimer({ startFrom: cooldownInterval });

  return (
    <div className='str-chat__message-input-cooldown' data-testid='cooldown-timer'>
      {secondsLeft}
    </div>
  );
};
