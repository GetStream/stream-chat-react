import React from 'react';

import { useEventContext } from '../contexts/EventContext';

export const CloseChatButton: React.FC = () => {
  const { isFullScreen, setIsFullScreen } = useEventContext();

  return (
    <svg
      className='chat-close'
      onClick={() => setIsFullScreen((prev) => !prev)}
      xmlns='http://www.w3.org/2000/svg'
      width='40'
      height='40'
      fill='none'
      viewBox='0 0 40 40'
    >
      <path
        fill={'var(--card-background)'}
        d='M0 8a8 8 0 018-8h24a8 8 0 018 8v24a8 8 0 01-8 8H8a8 8 0 01-8-8V8z'
      ></path>
      {isFullScreen ? (
        <path
          fill={'var(--primary-accent)'}
          fillRule='evenodd'
          d='M22.447 25l-4.777-5 4.777-5a1.202 1.202 0 000-1.656 1.093 1.093 0 00-1.592 0l-5.525 5.777c-.232.241-.344.56-.329.879-.015.319.098.638.33.879l5.524 5.777a1.093 1.093 0 001.592 0 1.202 1.202 0 000-1.656z'
          clipRule='evenodd'
        ></path>
      ) : (
        <path
          fill={'var(--primary-accent)'}
          fillRule='evenodd'
          d='M17.553 15l4.777 5-4.777 5a1.202 1.202 0 000 1.656 1.093 1.093 0 001.592 0l5.525-5.777c.231-.241.344-.56.329-.879a1.184 1.184 0 00-.33-.879l-5.524-5.777a1.093 1.093 0 00-1.592 0 1.202 1.202 0 000 1.656z'
          clipRule='evenodd'
        ></path>
      )}
    </svg>
  );
};
