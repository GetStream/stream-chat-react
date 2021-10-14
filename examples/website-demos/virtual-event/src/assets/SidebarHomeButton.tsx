import React from 'react';

import { useEventContext } from '../contexts/EventContext';

type Props = {
  globalUnread: boolean;
};

export const SidebarHomeButton: React.FC<Props> = ({ globalUnread }) => {
  const {
    setChatType,
    setIsFullScreen,
    setEventName,
    setSelected,
    setShowChannelList,
  } = useEventContext();

  const handleClick = () => {
    setChatType('global');
    setEventName(undefined);
    setIsFullScreen(false);
    setSelected('overview');
    setShowChannelList(false);
  };

  return (
    <div className='chat-sidebar-button'>
      <div className={`${globalUnread ? 'unread' : ''}`} />{' '}
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
          d='M27.707 29.707A1 1 0 0028 29v-5h3L20.673 10.26a1 1 0 00-1.346 0L9 24h3v5a1 1 0 001 1h14a1 1 0 00.707-.293zM19 22a1 1 0 00-1 1v4a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 00-1-1h-2z'
          clipRule='evenodd'
        ></path>
      </svg>
    </div>
  );
};
