import { useEffect, useState } from 'react';

import { CooldownTimerProps } from 'stream-chat-react';

import './SocialCooldownTimer.scss';

export const SocialCooldownTimer: React.FC<CooldownTimerProps> = (props) => {
  const { cooldownInterval, setCooldownRemaining } = props;

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
    <div className='cooldown-timer'>
      <span className='cooldown-timer-text'>{seconds === 0 ? null : seconds}</span>
    </div>
  );
};
