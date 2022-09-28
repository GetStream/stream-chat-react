import React from 'react';
import type { ChannelSort } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  MessageList,
  Thread,
  useChannelStateContext,
  Window,
} from '../index';
import { ConnectedUser, ConnectedUserProps } from './utils';

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
            attachments: [
              {
                fallback: 'A.png',
                image_url: 'https://getstream.imgix.net/images/random_svg/A.png',
                type: 'image',
              },
              {
                fallback: 'B.png',
                image_url: 'https://getstream.imgix.net/images/random_svg/B.png',
                type: 'image',
              },
            ],
            text:
              'chat: https://getstream.io/chat/\nactivity-feeds: https://getstream.io/activity-feeds/',
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

const WrappedConnectedUser = ({ token, userId }: Omit<ConnectedUserProps, 'children'>) => (
  <ConnectedUser token={token} userId={userId}>
    <ChannelList
      filters={{ id: { $eq: 'edit-message-channel' }, members: { $in: [userId] } }}
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
