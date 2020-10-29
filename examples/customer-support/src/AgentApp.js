import React from 'react';
import { Chat } from 'stream-chat-react';

import { AgentHeader } from './components/AgentHeader/AgentHeader';

export const AgentApp = ({ agentClient, channel }) => {
  return (
    <div className="agent-wrapper">
      <Chat client={agentClient}>
        <AgentHeader />
      </Chat>
    </div>
  );
};
