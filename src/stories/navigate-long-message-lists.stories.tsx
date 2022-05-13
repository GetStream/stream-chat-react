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

const ReceiveReplyButton = () => {
  const { client } = useChatContext();
  const { channel, threadMessages } = useChannelStateContext();
  const lastMessage = channel.state.messages.slice(-1)[0];
  return (
    <>
      <button
        data-testid='receive-reply'
        onClick={() =>
          channel.sendMessage({
            parent_id: lastMessage.id,
            text: 'Reply back',
          })
        }
      >
        Receive reply
      </button>
      <button
        data-testid='delete-other-last-reply'
        onClick={async () => {
          const lastReply = threadMessages?.slice(-1)[0];
          if (lastReply) {
            await client.deleteMessage(lastReply.id, true);
          }
        }}
      >
        Delete other user&apos;s last reply
      </button>
    </>
  );
};
// Sort in reverse order to avoid auto-selecting unread channel
const sort: ChannelSort = { last_updated: 1 };

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

const OtherUserControls = () => {
  const theOtherUserCredentials = document.location.search.match(import.meta.env.E2E_TEST_USER_1)
    ? {
        token: import.meta.env.E2E_TEST_USER_2_TOKEN,
        userId: import.meta.env.E2E_TEST_USER_2,
      }
    : {
        token: import.meta.env.E2E_TEST_USER_1_TOKEN,
        userId: import.meta.env.E2E_TEST_USER_1,
      };

  return (
    <ConnectedUser {...theOtherUserCredentials}>
      <div style={{ display: 'none' }}>
        <ChannelList
          filters={{ id: { $eq: channelId }, members: { $in: [theOtherUserCredentials.userId] } }}
          setActiveChannelOnMount={true}
          sort={sort}
        />
      </div>
      <div style={{ height: '30px' }}>
        <Channel>
          <ReceiveReplyButton />
        </Channel>
      </div>
    </ConnectedUser>
  );
};

const WrappedConnectedUser = ({ token, userId }: Omit<ConnectedUserProps, 'children'>) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div>
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
    </div>
    <div className='other-channel'>
      <style>{`
      .other-channel .str-chat-channel {
        max-height: 30px;
        display: inline-block;
      }
      .other-channel .str-chat__container {
        height: 30px;
      }
      `}</style>
      <OtherUserControls />
    </div>
  </div>
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
