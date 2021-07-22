import React from 'react';

import { CloseChatButton, SidebarDMButton, SidebarHomeButton, SidebarQAButton } from '../../assets';

export const ChatSidebar: React.FC = () => {
  return (
    <div className='chat-sidebar'>
      <CloseChatButton />
      <SidebarHomeButton />
      <SidebarDMButton />
      <SidebarQAButton />
    </div>
  );
};
