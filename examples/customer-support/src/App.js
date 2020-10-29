import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

import 'stream-chat-react/dist/css/index.css';

import './App.css';

import { CustomerApp } from './CustomerApp';
import { AgentApp } from './AgentApp';

const apiKey = 'qk4nn7rpcn75';
const channelId = 'support-demo';

const customerUserId = 'example-user';
const customerUserToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g';

const agentUserId = 'daniel';
const agentUserToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGFuaWVsIn0.93CpZFjrU-mrvQQWDkI4UMgK10Lim1t8X3WAVcmHHVw';

const App = () => {
  const [channel, setChannel] = useState();
  const [open, setOpen] = useState(true);

  const supportClient = new StreamChat(apiKey);
  const agentClient = new StreamChat(apiKey);

  supportClient.setUser({ id: customerUserId }, customerUserToken);
  agentClient.setUser({ id: agentUserId }, agentUserToken);

  useEffect(() => {
    const getChannel = async () => {
      const [existingChannel] = await supportClient.queryChannels({
        id: channelId,
      });

      if (existingChannel) await existingChannel.delete();

      const newChannel = supportClient.channel('commerce', channelId, {
        image: 'https://i.stack.imgur.com/e7G42m.jpg',
        name: 'Hello',
        subtitle: 'We are here to help.',
        example: 1,
      });

      await newChannel.watch();

      setChannel(newChannel);
    };

    if (supportClient) {
      getChannel();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <AgentApp {...{ agentClient, channel }} />
      <CustomerApp {...{ channel, open, setOpen, supportClient }} />
    </>
  );
};

export default App;
