import React from 'react';

import { useEventContext } from '../contexts/EventContext';

type Props = {
  qaUnread: boolean;
};

export const SidebarQAButton: React.FC<Props> = ({ qaUnread }) => {
  const { setChatType, setIsFullScreen, setShowChannelList } = useEventContext();

  const handleClick = () => {
    setChatType('qa');
    setIsFullScreen(false);
    setShowChannelList(false);
  };

  return (
    <div className='chat-sidebar-button'>
      <div className={`${qaUnread ? 'unread' : ''}`} />{' '}
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
          d='M9.663 25.762h5.122v-2.095h-1.662l1.74-1.738-.66-.739c-.99-1.108-1.513-2.426-1.513-3.809 0-3.467 3.289-6.286 7.333-6.286 3.658 0 6.783 2.34 7.268 5.445l2.07-.323C28.718 12.102 24.704 9 20.023 9c-5.198 0-9.429 3.76-9.429 8.381 0 1.587.49 3.1 1.426 4.427l-2.825 2.824a.662.662 0 00.468 1.13z'
          clipRule='evenodd'
        ></path>
        <path
          fill='var(--text-mid-emphasis)'
          d='M30.381 30c.494 0 .788-.562.514-.982l-1.713-2.629A5.71 5.71 0 0029.709 24c0-3.309-2.85-6-6.354-6S17 20.691 17 24s2.85 6 6.355 6h7.026z'
        ></path>
      </svg>
    </div>
  );
};
