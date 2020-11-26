import React from 'react';
import {
  Channel,
  Window,
  MessageList,
  MessageCommerce,
  MessageInput,
} from 'stream-chat-react';

import { AgentChannelListContainer } from './components/AgentChannelListContainer/AgentChannelListContainer';
import { AgentChannelHeader } from './components/AgentChannelHeader/AgentChannelHeader';
import { AgentMessageInput } from './components/MessageInput/AgentMessageInput';

export const AgentApp = ({ customerUserId }) => (
  <div style={{ display: 'flex' }}>
    <AgentChannelListContainer />
    <div className="agent-channel-wrapper">
      <Channel>
        <Window>
          <AgentChannelHeader {...{ customerUserId }} />
          <MessageList Message={MessageCommerce} />
          <MessageInput focus Input={AgentMessageInput} />
        </Window>
      </Channel>
    </div>
  </div>
);
