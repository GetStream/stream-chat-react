import React from 'react';

import { Channel, MessageInput, Window } from 'stream-chat-react';

import { SocialChannelHeader } from '../ChannelHeader/SocialChannelHeader';
import { SocialMessageList } from '../MessageList/SocialMessageList';

import './ChannelContainer.scss';

type Props = {};

export const ChannelContainer: React.FC<Props> = (props) => {
  return (
    <div className='channel-container'>
      <Channel>
        <Window>
          <SocialChannelHeader />
          <SocialMessageList />
          <MessageInput />
        </Window>
      </Channel>
    </div>
  );
};