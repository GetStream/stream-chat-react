import { NextPage } from 'next';
import React from 'react';

import { StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';

const apiKey = process.env.NEXT_PUBLIC_STREAM_KEY || 'API_KEY';
const userId = process.env.NEXT_PUBLIC_USER_ID || 'USER_ID';
const userToken = process.env.NEXT_PUBLIC_USER_TOKEN || 'USER_TOKEN';

const options = { state: true, presence: true, limit: 10 };

const chatClient = StreamChat.getInstance(apiKey);

if (typeof window !== 'undefined') {
  chatClient.connectUser({ id: userId }, userToken);
}

const Home: NextPage = () => (
  <Chat client={chatClient}>
    <ChannelList options={options} />
    <Channel>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput focus />
      </Window>
      <Thread />
    </Channel>
  </Chat>
);

export default Home;
