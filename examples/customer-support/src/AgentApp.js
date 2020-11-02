import React from 'react';
import {
  Channel,
  Window,
  MessageList,
  MessageCommerce,
  MessageInput,
} from 'stream-chat-react';

import { AgentChannelListContainer } from './components/AgentChannelListContainer/AgentChannelListContainer';

export const AgentApp = () => (
  <div style={{ display: 'flex' }}>
    <AgentChannelListContainer />
    <div className="agent-channel-wrapper">
      <Channel>
        <Window>
          <MessageList Message={MessageCommerce} />
          <MessageInput focus />
        </Window>
      </Channel>
    </div>
  </div>
);
