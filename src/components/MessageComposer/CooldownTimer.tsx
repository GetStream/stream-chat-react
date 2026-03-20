import React from 'react';
import { useCooldownRemaining } from './hooks';

export const CooldownTimer = () => {
  const secondsLeft = useCooldownRemaining();

  return (
    <div className='str-chat__message-composer-cooldown' data-testid='cooldown-timer'>
      {secondsLeft}
    </div>
  );
};
