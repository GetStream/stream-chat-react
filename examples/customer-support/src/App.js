import React from 'react';
import { StreamChat } from 'stream-chat';

import 'stream-chat-react/dist/css/index.css';

import './App.css';

import { AgentApp } from './AgentApp';
import { CustomerApp } from './CustomerApp';

const apiKey = 'qk4nn7rpcn75';

const customerUserId = 'manuela';
const customerUserToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFudWVsYSJ9.WeIvY03gXaTHty9RHVPHuTdNRvHx4F7nxH_i5TfdJdk';

const agentUserId = 'daniel';
const agentUserToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGFuaWVsIn0.93CpZFjrU-mrvQQWDkI4UMgK10Lim1t8X3WAVcmHHVw';

const App = () => {
  const customerClient = new StreamChat(apiKey);
  const agentClient = new StreamChat(apiKey);

  customerClient.setUser({ id: customerUserId }, customerUserToken);
  agentClient.setUser({ id: agentUserId }, agentUserToken);

  return (
    <>
      <AgentApp {...{ agentClient }} />
      <CustomerApp {...{ customerClient }} />
    </>
  );
};

export default App;
