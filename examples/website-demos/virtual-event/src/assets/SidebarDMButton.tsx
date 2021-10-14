import React from 'react';

import { useEventContext } from '../contexts/EventContext';

type Props = {
  dmUnread: boolean;
};

export const SidebarDMButton: React.FC<Props> = ({ dmUnread }) => {
  const { setChatType, setIsFullScreen, setShowChannelList } = useEventContext();

  const handleClick = () => {
    setChatType('direct');
    setIsFullScreen(false);
    setShowChannelList(true);
  };

  return (
    <div className='chat-sidebar-button'>
      <div className={`${dmUnread ? 'unread' : ''}`} />
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
          d='M29.702 10.298a.972.972 0 00-.999-.249L8.511 16.556l-.007.003a.909.909 0 00-.35.346 1.045 1.045 0 00-.154.528c0 .19.063.376.154.529a.91.91 0 00.35.346l.002.001 9.163 4.022 4.02 9.157c.134.395.529.512.878.512.377 0 .753-.25.88-.63l6.502-20.18a.64.64 0 00.017-.458 1.058 1.058 0 00-.264-.434zM18.224 20.43l-6.7-2.872 14.153-4.61-7.332 7.332c-.027.027-.05.05-.067.069a.304.304 0 00-.048.068l-.003.006-.003.007z'
          clipRule='evenodd'
        ></path>
      </svg>
    </div>
  );
};
