import { useEffect, useState } from 'react';
import { useBreakpoint } from './useBreakpoint';

export const useMobilePress = () => {
  const [targetMessage, setTargetMessage] = useState(null);

  const breakpoint = useBreakpoint();

  /** @type {(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void} */
  const handleMobilePress = (event) => {
    if (event.target instanceof HTMLElement && breakpoint.device === 'mobile') {
      const closestMessage = event.target.closest('.str-chat__message-simple');

      if (!closestMessage) return;
      setTargetMessage(closestMessage);

      if (closestMessage.classList.contains('mobile-press')) {
        closestMessage.classList.remove('mobile-press');
      } else {
        closestMessage.classList.add('mobile-press');
      }
    }
  };

  useEffect(() => {
    const handleClick = (event) => {
      const isClickInside = targetMessage?.contains(event.target);

      if (!isClickInside && targetMessage) {
        targetMessage.classList.remove('mobile-press');
      }
    };

    if (breakpoint.device === 'mobile') {
      document.addEventListener('click', handleClick);
    }
    return () => document.removeEventListener('click', handleClick);
  }, [breakpoint, targetMessage]);

  return { handleMobilePress };
};
