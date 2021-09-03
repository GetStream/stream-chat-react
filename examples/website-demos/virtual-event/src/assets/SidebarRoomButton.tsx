import React from 'react';

import { useEventContext } from '../contexts/EventContext';

type Props = {
  eventUnread: boolean;
};

export const SidebarRoomButton: React.FC<Props> = ({ eventUnread }) => {
  const { setChatType, setIsFullScreen, setShowChannelList } = useEventContext();

  const handleClick = () => {
    setChatType('room');
    setIsFullScreen(false);
    setShowChannelList(false);
  };

  return (
    <div className='chat-sidebar-button'>
      <div className={`${eventUnread ? 'unread' : ''}`} />
      <svg
        onClick={handleClick}
        xmlns='http://www.w3.org/2000/svg'
        width='40'
        height='40'
        fill='none'
        viewBox='0 0 40 40'
      >
        <path
          fill='var(--card-background)'
          d='M0 8a8 8 0 018-8h24a8 8 0 018 8v24a8 8 0 01-8 8H8a8 8 0 01-8-8V8z'
        ></path>
        <path
          fill='var(--text-mid-emphasis)'
          fillRule='evenodd'
          d='M20 19a4 4 0 100-8 4 4 0 000 8zm-5.5-7a3.5 3.5 0 100 7 1 1 0 100-2 1.5 1.5 0 010-3 1 1 0 100-2zM13 27a7 7 0 1113.903 1.167C26.603 29.958 22 30.5 20 30.5s-6.581-.425-6.902-2.33A7.05 7.05 0 0113 27zm-.146-5.227a1 1 0 00-1.26-1.554 6.988 6.988 0 00-2.496 6.61 1 1 0 101.972-.332 4.988 4.988 0 011.784-4.725zM29.5 15.5A3.5 3.5 0 0026 12a1 1 0 100 2 1.5 1.5 0 010 3 1 1 0 100 2 3.5 3.5 0 003.5-3.5zm-2.13 6.273a1 1 0 011.26-1.554 6.989 6.989 0 012.497 6.61 1 1 0 11-1.972-.332 4.988 4.988 0 00-1.784-4.725z'
          clipRule='evenodd'
        ></path>
      </svg>
    </div>
  );
};
