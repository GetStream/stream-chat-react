/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import type { ChannelSort } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  MessageList,
  Thread,
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  Window,
} from '../index';
import { ConnectedUser, ConnectedUserProps } from './utils';

const user1Id = import.meta.env.E2E_TEST_USER_1;
const user1Token = import.meta.env.E2E_TEST_USER_1_TOKEN;
const user2Id = import.meta.env.E2E_TEST_USER_2;
const user2Token = import.meta.env.E2E_TEST_USER_2_TOKEN;
const channelId = import.meta.env.E2E_LONG_MESSAGE_LISTS_CHANNEL;

if (!channelId || typeof channelId !== 'string') {
  throw new Error('expected ADD_MESSAGE_CHANNEL');
}

const OtherUserControlButtons = () => {
  const { client } = useChatContext();
  const { channel, messages, threadMessages } = useChannelStateContext();
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
      <button
        data-testid='add-other-user-message'
        onClick={() =>
          channel.sendMessage({
            text: "Other user's message",
          })
        }
      >
        Receive a message
      </button>
      <button
        data-testid='delete-other-last-message'
        onClick={async () => {
          const lastMessage = messages?.slice(-1)[0];
          if (lastMessage) {
            await client.deleteMessage(lastMessage.id, true);
          }
        }}
      >
        Delete other user&apos;s last message
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

const SetThreadOpen = () => {
  const { openThread } = useChannelActionContext();
  const { messages } = useChannelStateContext();

  useEffect(() => {
    if (!messages) return;
    const [lastMsg] = messages.slice(-1);

    if (lastMsg) openThread(lastMsg, { preventDefault: () => null } as any);
  }, [messages]);

  return null;
};

const OtherUserControls = () => {
  const theOtherUserCredentials = document.location.search.match('user1')
    ? { token: user2Token, userId: user2Id }
    : { token: user1Token, userId: user1Id };

  return (
    <div className={theOtherUserCredentials.userId}>
      <style>{`
      .${theOtherUserCredentials.userId} .str-chat-channel {
        max-height: 30px;
        display: inline-block;
      }
      .${theOtherUserCredentials.userId} .str-chat__container {
        height: 30px;
      }

      .${theOtherUserCredentials.userId} .messaging.str-chat .str-chat__thread {
        display: none;
      }
      `}</style>
      <ConnectedUser {...theOtherUserCredentials}>
        <div style={{ display: 'none' }}>
          <ChannelList
            customActiveChannel={channelId}
            filters={{ id: { $eq: channelId }, members: { $in: [theOtherUserCredentials.userId] } }}
            setActiveChannelOnMount={true}
            sort={sort}
          />
        </div>
        <div style={{ height: '30px' }}>
          <Channel>
            <SetThreadOpen />
            <OtherUserControlButtons />
            <Thread />
          </Channel>
        </div>
      </ConnectedUser>
    </div>
  );
};

const WrappedConnectedUser = ({ token, userId }: Omit<ConnectedUserProps, 'children'>) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {/* FIXME: temporary fix for screenshot tests */}
    <style>{`
	 	.str-chat__thread .str-chat__message-data.str-chat__message-simple-data {
			 visibility: hidden;
		}
	 `}</style>
    <div className={userId}>
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
    <OtherUserControls />
  </div>
);

export const User1 = () => {
  if (!user1Id || typeof user1Id !== 'string') {
    throw new Error('expected TEST_USER_1');
  }
  if (!user1Token || typeof user1Token !== 'string') {
    throw new Error('expected TEST_USER_1_TOKEN');
  }
  return <WrappedConnectedUser token={user1Token} userId={user1Id} />;
};
