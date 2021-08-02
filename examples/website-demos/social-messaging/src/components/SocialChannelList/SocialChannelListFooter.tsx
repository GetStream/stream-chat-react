import React from 'react';

import { Chats } from '../../assets/Chats';
import { Mentions } from '../../assets//Mentions';
import { useViewContext } from '../../contexts/ViewContext';

import './SocialChannelList.scss';

export const SocialChannelListFooter: React.FC = () => {
  const { chatsUnreadCount, mentionsUnreadCount, setListMentions } = useViewContext();

  return (
    <div className='channel-list-footer'>
      <div className='chats' onClick={() => setListMentions(false)}>
        <div className={`chats-unread ${chatsUnreadCount ? '' : 'unreadCount'}`}>
          <span className='chats-unread-text'>{chatsUnreadCount}</span>
        </div>
        <div className='chats-text'>
          <Chats />
          <span>Chats</span>
        </div>
      </div>
      <div className='mentions' onClick={() => setListMentions(true)}>
        <div className={`mentions-unread ${mentionsUnreadCount ? '' : 'unreadCount'}`}>
          <span className='mentions-unread-text'>{mentionsUnreadCount}</span>
        </div>
        <div className='mentions-text'>
          <Mentions />
          <span>Mentions</span>
        </div>
      </div>
    </div>
  );
};
