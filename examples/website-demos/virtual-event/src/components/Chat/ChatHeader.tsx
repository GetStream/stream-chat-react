import React from 'react';

import { CloseChatButton } from '../../assets';

const ChatHeaderTabs = () => {
  return (
    <div className='chat-components-header-tabs'>
      <div>Global</div>
      <div>Event</div>
      <div>DM</div>
      <div>Q&A</div>
    </div>
  );
};

export const ChatHeader: React.FC = () => {
  return (
    <div className='chat-components-header'>
      <div className='chat-components-header-top'>
        <CloseChatButton />
      </div>
      <ChatHeaderTabs />
    </div>
  );
};
