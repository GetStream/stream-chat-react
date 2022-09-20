import React, { useState } from 'react';
import { ConnectedUser, ConnectedUserProps } from './utils';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  MESSAGE_ACTIONS,
  MessageActionsArray,
  MessageList,
  Thread,
  Window,
} from '../components';

const allActions = Object.keys(MESSAGE_ACTIONS);
const WrappedConnectedUser = ({ token, userId }: Omit<ConnectedUserProps, 'children'>) => {
  const [messageActions, setMessageActions] = useState<MessageActionsArray>(allActions);
  return (
    <ConnectedUser token={token} userId={userId}>
      <ChannelList filters={{ id: { $eq: 'jump-to-message' } }} />
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList messageActions={messageActions} />
          <div>
            Current messageActions: <i>{messageActions.join(', ') || 'None'}</i>
          </div>
          <div>
            <span>Switch to: </span>
            <button onClick={() => setMessageActions(allActions)} type='button'>
              All
            </button>
            <button onClick={() => setMessageActions(['edit', 'react'])} type='button'>
              edit, react
            </button>
            <button onClick={() => setMessageActions(['edit', 'react', 'reply'])} type='button'>
              edit, react, reply
            </button>
            <button onClick={() => setMessageActions([])} type='button'>
              None
            </button>
          </div>
        </Window>
        <Thread messageActions={messageActions} />
      </Channel>
    </ConnectedUser>
  );
};

export const ToggleActions = () => {
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
