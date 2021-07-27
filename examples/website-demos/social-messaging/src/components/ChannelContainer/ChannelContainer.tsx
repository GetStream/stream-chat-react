import React from 'react';

import { MessageInput, MessageList, Window } from 'stream-chat-react';

import { NewChat } from '../NewChat/NewChat';
import { SocialChannelHeader } from '../ChannelHeader/SocialChannelHeader';

import { useViewContext } from '../../contexts/ViewContext';

import './ChannelContainer.scss';

export const ChannelContainer: React.FC = () => {
  const { isNewChat } = useViewContext();
  
  return (
    <div className='channel-container'>
      <Window>
        <SocialChannelHeader />
        {isNewChat ? <NewChat /> : <MessageList />}
        <MessageInput />
      </Window>
    </div>
  );
};