import React from 'react';

import { useEventContext } from '../contexts/EventContext';

type Props = {
  eventUnread: boolean;
};

export const SidebarEventButton: React.FC<Props> = ({ eventUnread }) => {
  const { setChatType, setIsFullScreen, setShowChannelList } = useEventContext();

  const handleClick = () => {
    setChatType('main-event');
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
          d='M27 10v1c1.953 0 3.03.926 3 2.943v13.558A3.492 3.492 0 0126.501 31H13.5A3.492 3.492 0 0110 27.501V13.943C10 12.035 11 11 13 11v-1a1 1 0 112 0v1h10v-1a1 1 0 012 0zm-.33 19c.752 0 1.33-.607 1.33-1.33V15.078H12V27.67c0 .723.607 1.33 1.33 1.33h13.34zm-6.214-11.984a.5.5 0 00-.912 0l-1.23 2.74a.5.5 0 01-.402.293l-2.986.323a.5.5 0 00-.282.867l2.226 2.017a.5.5 0 01.153.473l-.615 2.94a.5.5 0 00.738.535l2.605-1.493a.5.5 0 01.498 0l2.605 1.494a.5.5 0 00.738-.537l-.615-2.94a.5.5 0 01.153-.472l2.226-2.017a.5.5 0 00-.282-.867l-2.986-.323a.5.5 0 01-.402-.293l-1.23-2.74z'
          clipRule='evenodd'
        ></path>
      </svg>
    </div>
  );
};
