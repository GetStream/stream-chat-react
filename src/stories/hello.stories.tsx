/* eslint-disable @typescript-eslint/no-explicit-any */
import '@stream-io/stream-chat-css/dist/css/index.css';
import React, { useEffect, useState } from 'react';
import { ChannelFilters, ChannelOptions, ChannelSort, Event, StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from '../index';
import { apiKey, StreamChatGenerics } from './utils';

const channelId = import.meta.env.E2E_ADD_MESSAGE_CHANNEL;
const userId = import.meta.env.E2E_TEST_USER_1 as string;
const token = import.meta.env.E2E_TEST_USER_1_TOKEN as string;

if (!channelId || typeof channelId !== 'string') {
  throw new Error('expected ADD_MESSAGE_CHANNEL');
}

// Sort in reverse order to avoid auto-selecting unread channel
const sort: ChannelSort = { last_updated: 1 };
const filters: ChannelFilters = { members: { $in: [userId] }, type: 'messaging' };
const options: ChannelOptions = { limit: 10, presence: true, state: true };

const chatClient = StreamChat.getInstance<StreamChatGenerics>(apiKey);
let sharedPromise = Promise.resolve();

export const BasicSetup = () => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    sharedPromise.then(() => chatClient.connectUser({ id: userId }, token));

    const handleConnectionChange = ({ online = false }: Event) => {
      setConnected(online);
    };

    chatClient.on('connection.changed', handleConnectionChange);

    return () => {
      chatClient.off('connection.changed', handleConnectionChange);
      sharedPromise = chatClient.disconnectUser();
    };
  }, []);

  if (!connected) {
    return <p>Connecting {userId}...</p>;
  }

  return (
    <Chat client={chatClient}>
      <ChannelList filters={filters} options={options} showChannelSearch sort={sort} />
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
};
