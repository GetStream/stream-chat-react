/* eslint-disable @typescript-eslint/no-explicit-any */
import '@stream-io/stream-chat-css/dist/css/index.css';
import React, { useEffect, useState } from 'react';
import { ChannelFilters, ChannelSort, StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageList,
  useChannelStateContext,
  Window,
} from '../index';
import { apiKey, StreamChatGenerics, StyleFix, testUser1Id } from './utils';

const channelId = import.meta.env.VITE_ADD_MESSAGE_CHANNEL;
if (!channelId || typeof channelId !== 'string') {
  throw new Error('expected ADD_MESSAGE_CHANNEL');
}

const Controls = () => {
  const { channel } = useChannelStateContext();

  return (
    <div>
      <button data-testid='truncate' onClick={() => channel.truncate()}>
        Truncate
      </button>
      <button
        data-testid='add-message'
        onClick={() =>
          channel.sendMessage({
            text: 'Hello world!',
          })
        }
      >
        Add message
      </button>
    </div>
  );
};

const filters: ChannelFilters = {
  members: { $in: [testUser1Id] },
};
// Sort in reverse order to avoid auto-selecting unread channel
const sort: ChannelSort = { last_updated: 1 };

const chatClient = StreamChat.getInstance<StreamChatGenerics>(apiKey);
const ConnectedUser = ({ token, userId }: { token: string; userId: string }) => {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const connect = async () => {
      if (chatClient.userID) {
        await chatClient.disconnectUser();
      }
      await chatClient.connectUser({ id: userId }, token);
      // Why do I need to do this?
      await chatClient.tokenManager.setTokenOrProvider(token, { id: userId });
      setConnected(true);
    };
    if (chatClient.wsConnection?.isHealthy && chatClient.userID === userId) {
      setConnected(true);
    } else {
      connect();
    }
  }, []);
  if (!connected) {
    return <p>Connecting {userId}...</p>;
  }
  return (
    <div>
      <h3>User: {userId}</h3>
      <Chat client={chatClient}>
        <ChannelList filters={filters} sort={sort} />
        <Channel>
          <Window>
            <ChannelHeader />
            <MessageList />
            <Controls />
          </Window>
        </Channel>
      </Chat>
    </div>
  );
};

export const User1 = () => {
  const userId = import.meta.env.VITE_TEST_USER_1;
  const token = import.meta.env.VITE_TEST_USER_1_TOKEN;
  if (!userId || typeof userId !== 'string') {
    throw new Error('expected TEST_USER_1');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('expected TEST_USER_1_TOKEN');
  }
  return (
    <div>
      <StyleFix />
      <ConnectedUser token={token} userId={userId} />
    </div>
  );
};

export const User2 = () => {
  const userId = import.meta.env.VITE_TEST_USER_2;
  const token = import.meta.env.VITE_TEST_USER_2_TOKEN;
  if (!userId || typeof userId !== 'string') {
    throw new Error('expected TEST_USER_2');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('expected TEST_USER_2_TOKEN');
  }
  return (
    <div>
      <StyleFix />
      <ConnectedUser token={token} userId={userId} />
    </div>
  );
};
