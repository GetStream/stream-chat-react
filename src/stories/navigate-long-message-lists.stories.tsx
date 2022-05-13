/* eslint-disable @typescript-eslint/no-explicit-any */
import '@stream-io/stream-chat-css/dist/css/index.css';
import React from 'react';
import type { ChannelSort } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  MessageList,
  Thread,
  useChannelStateContext,
  useChatContext,
  Window,
} from '../index';
import { ConnectedUser, ConnectedUserProps } from './utils';

const channelId = import.meta.env.E2E_LONG_MESSAGE_LISTS_CHANNEL;
if (!channelId || typeof channelId !== 'string') {
  throw new Error('expected ADD_MESSAGE_CHANNEL');
}

const Controls = () => {
  const { client } = useChatContext();
  const { threadMessages } = useChannelStateContext();

  return (
    <div>
      <button
        data-testid='delete-last-reply'
        onClick={async () => {
          const lastReply = threadMessages?.slice(-1)[0];
          if (lastReply) {
            await client.deleteMessage(lastReply.id, true);
          }
        }}
      >
        Delete last reply
      </button>
    </div>
  );
};

// Sort in reverse order to avoid auto-selecting unread channel
const sort: ChannelSort = { last_updated: 1 };

const WrappedConnectedUser = ({ token, userId }: Omit<ConnectedUserProps, 'children'>) => (
  <ConnectedUser token={token} userId={userId}>
    <ChannelList
      filters={{ id: { $eq: channelId }, members: { $in: [userId] } }}
      setActiveChannelOnMount={false}
      sort={sort}
    />
    <Channel>
      <Window>
        <ChannelHeader />
        <MessageList />
        <Controls />
      </Window>
      <Thread />
    </Channel>
  </ConnectedUser>
);

export const User1 = () => {
  const userId = import.meta.env.E2E_TEST_USER_1;
  const token = import.meta.env.E2E_TEST_USER_1_TOKEN;
  if (!userId || typeof userId !== 'string') {
    throw new Error('expected TEST_USER_1');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('expected TEST_USER_1_TOKEN');
  }
  return <WrappedConnectedUser token={token} userId={userId} />;
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
  return <WrappedConnectedUser token={token} userId={userId} />;
};
