import React from 'react';
import {
  Channel,
  MessageCommerce,
  MessageInput,
  MessageList,
  Window,
} from 'stream-chat-react';

import { AgentChannelListContainer } from './components/AgentChannelListContainer/AgentChannelListContainer';
import { AgentChannelHeader } from './components/AgentChannelHeader/AgentChannelHeader';
import { AgentMessageInput } from './components/MessageInput/AgentMessageInput';

export const AgentApp = ({ agentChannelId, customerChannelId }) => (
  <div style={{ display: 'flex' }}>
    <AgentChannelListContainer {...{ agentChannelId, customerChannelId }} />
    <div className="agent-channel-wrapper">
      <Channel>
        <Window>
          <AgentChannelHeader />
          <MessageList Message={MessageCommerce} />
          <MessageInput focus Input={AgentMessageInput} />
        </Window>
      </Channel>
    </div>
  </div>
);
