import React from 'react';

import { MessageInput, MessageList, Window } from 'stream-chat-react';

import { NewChat } from '../NewChat/NewChat';
import { SocialChannelHeader } from '../ChannelHeader/SocialChannelHeader';

import { useViewContext } from '../../contexts/ViewContext';

export const ChannelContainer: React.FC = () => {
  const { isNewChat } = useViewContext();

  return (
    <>
      <Window>
        <SocialChannelHeader />
        {isNewChat ? <NewChat /> : <MessageList />}
        <MessageInput mentionAllAppUsers />
      </Window>
      {/* <Thread /> */}
    </>
  );
};
