import React from 'react';

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

const PinnedMessagesList = () => {
  const { pinnedMessages } = useChannelStateContext();

  if (!pinnedMessages?.length) return null;

  return (
    <ul data-testid='pinned-messages-list'>
      {pinnedMessages?.map((pm) => (
        <li key={pm.id}>{pm.text}</li>
      ))}
    </ul>
  );
};

const Controls = () => {
  const { channel } = useChannelStateContext();

  return (
    <div>
      <button data-testid='truncate' onClick={() => channel.truncate()}>
        Truncate
      </button>
      <button
        data-testid='add-message'
        onClick={async () => {
          await channel.sendMessage({
            text: 'pin-message-0',
          });
          await channel.sendMessage({
            pinned: true,
            pinned_at: new Date().toISOString(),
            text: 'pin-message-1',
          });
          await channel.sendMessage({
            text: 'pin-message-2',
          });
        }}
      >
        Add message
      </button>
    </div>
  );
};

const App = ({ token, userId }: Omit<ConnectedUserProps, 'children'>) => (
  <>
    <ConnectedUser token={token} userId={userId}>
      <ChannelList
        filters={{ id: { $eq: 'pin-message-channel' }, members: { $in: [userId] } }}
        setActiveChannelOnMount
      />
      <Channel>
        <PinnedMessagesList />
        <Window>
          <ChannelHeader />
          <MessageList />
        </Window>
        <Thread />
        <Controls />
      </Channel>
    </ConnectedUser>
  </>
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
  return <App token={token} userId={userId} />;
};
