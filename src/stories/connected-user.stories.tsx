/* eslint-disable @typescript-eslint/no-explicit-any */
import '@stream-io/stream-chat-css/dist/css/index.css';
import React, { useEffect, useState } from 'react';
import { ChannelSort, Event, StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageList,
  useChannelStateContext,
  Window,
} from '../index';
import { apiKey, StreamChatGenerics } from './utils';

const channelId = import.meta.env.E2E_ADD_MESSAGE_CHANNEL;
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

// Sort in reverse order to avoid auto-selecting unread channel
const sort: ChannelSort = { last_updated: 1 };

const chatClient = StreamChat.getInstance<StreamChatGenerics>(apiKey);

// wait for disconnect to happen since there's only one shared
// client and two separate Chat components using it to prevent crashes
let sharedPromise = Promise.resolve();

const ConnectedUser = ({ token, userId }: { token: string; userId: string }) => {
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
    <>
      <h3>User: {userId}</h3>
      <Chat client={chatClient}>
        <ChannelList filters={{ members: { $in: [userId] } }} sort={sort} />
        <Channel>
          <Window>
            <ChannelHeader />
            <MessageList />
            <Controls />
          </Window>
        </Channel>
      </Chat>
    </>
  );
};

export const User1 = () => {
  const userId = import.meta.env.E2E_TEST_USER_1;
  const token = import.meta.env.E2E_TEST_USER_1_TOKEN;
  if (!userId || typeof userId !== 'string') {
    throw new Error('expected TEST_USER_1');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('expected TEST_USER_1_TOKEN');
  }
  return <ConnectedUser token={token} userId={userId} />;
};

export const User2 = () => {
  const userId = import.meta.env.E2E_TEST_USER_2;
  const token = import.meta.env.E2E_TEST_USER_2_TOKEN;
  if (!userId || typeof userId !== 'string') {
    throw new Error('expected TEST_USER_2');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('expected TEST_USER_2_TOKEN');
  }
  return <ConnectedUser token={token} userId={userId} />;
};
