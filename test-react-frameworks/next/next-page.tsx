// @ts-nocheck

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

const apiKey = process.env.STREAM_API_KEY;
const userId = process.env.USER_ID;
const userToken = process.env.USER_TOKEN;

if (!apiKey || !userId || !userToken)
  throw new Error('Missing either STREAM_API_KEY, USER_ID or USER_TOKEN');

const options = { limit: 10, presence: true, state: true };

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
