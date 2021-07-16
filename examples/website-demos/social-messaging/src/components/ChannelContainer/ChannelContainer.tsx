import React from 'react';

import { MessageInput, Window } from 'stream-chat-react';

import { NewChat } from '../NewChat/NewChat';
import { SocialChannelHeader } from '../ChannelHeader/SocialChannelHeader';
import { SocialMessageList } from '../MessageList/SocialMessageList';

import './ChannelContainer.scss';

type Props = {
  isNewChat: boolean;
  setNewChat: React.Dispatch<React.SetStateAction<boolean>>,
};

export const ChannelContainer: React.FC<Props> = (props) => {
  const { isNewChat, setNewChat } = props;
  
  const ChannelContents = () => {
      return (
        <>
          <SocialChannelHeader {...{isNewChat, setNewChat }} />
          {isNewChat ? <NewChat /> : <SocialMessageList />}
        </>
      )
  };

  return (
    <div className='channel-container'>
      <Window>
        <ChannelContents />
        <MessageInput />
      </Window>
    </div>
  );
};