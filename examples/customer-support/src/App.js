/* eslint-disable global-require */
import React, { useEffect, useState } from 'react';
import { Chat } from 'stream-chat-react';
import { StreamChat } from 'stream-chat';

import 'stream-chat-react/dist/css/index.css';

import './App.css';

import { AgentApp } from './AgentApp';
import { AgentHeader } from './components/AgentHeader/AgentHeader';
import { AgentLoading } from './components/AgentLoading/AgentLoading';
import { CustomerApp } from './CustomerApp';

const apiKey = 'qk4nn7rpcn75';
const agentChannelId = 'agent-demo';
const theme = 'light';

const agentUserId = 'daniel';
const agentUserToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGFuaWVsIn0.93CpZFjrU-mrvQQWDkI4UMgK10Lim1t8X3WAVcmHHVw';

const customerUserId = 'manuela';
const customerUserToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFudWVsYSJ9.WeIvY03gXaTHty9RHVPHuTdNRvHx4F7nxH_i5TfdJdk';

const previousUserId = 'roberto';
const previousUserToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9iZXJ0byJ9.FTjMgoD1LtPSzVyssiXKUNWWNdOgrCKkkeHG5DfdWes';

const App = () => {
  const customerClient = new StreamChat(apiKey);
  customerClient.setUser(
    {
      id: customerUserId,
      name: 'Kevin Rosen',
      image: require('./assets/kevin-avatar.png'),
    },
    customerUserToken,
  );

  const [agentClient, setAgentClient] = useState();
  const [initialClient, setInitialClient] = useState();
  const [initialChannel, setInitialChannel] = useState();

  /**
   * Creates and watches a channel with a mock customer as the user
   */
  useEffect(() => {
    const getInitialChannel = async () => {
      const client = new StreamChat(apiKey);
      await client.setUser(
        {
          id: previousUserId,
          name: 'Jen Alexander',
          image: require('./assets/jen-avatar.png'),
        },
        previousUserToken,
      );
      setInitialClient(client);

      const [existingChannel] = await client.queryChannels({
        id: agentChannelId,
      });

      if (existingChannel) await existingChannel.delete();

      const newChannel = await client.channel('commerce', agentChannelId, {
        image: require('./assets/jen-avatar.png'),
        name: 'Jen Alexander',
        subtitle: '#572 Enterprise Inquiry',
      });

      await newChannel.watch();

      setInitialChannel(newChannel);
    };

    if (!initialClient) {
      getInitialChannel();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Sends messages to mock channel, disconnects mock channel, and sets
   * support agent as current user
   */
  useEffect(() => {
    const sendMessages = async () => {
      await initialChannel.sendMessage({
        text: 'I have a question about Enterprise',
      });

      await initialChannel.sendMessage({
        text:
          'My company is looking to upgrade our account to Enterprise. Can you provide me with some additional pricing information?',
      });

      await initialChannel.stopWatching();
      await initialClient.disconnect();

      const client = new StreamChat(apiKey);
      await client.setUser({ id: agentUserId }, agentUserToken);

      const [existingChannel] = await client.queryChannels({
        id: agentChannelId,
      });

      await existingChannel.watch();

      setAgentClient(client);
    };

    if (initialChannel && !initialChannel.state.messages.length) {
      sendMessages();
    }
  }, [initialChannel, initialClient]);

  return (
    <>
      <div className="agent-wrapper">
        <AgentHeader />
        {agentClient ? (
          <Chat client={agentClient}>
            <AgentApp />
          </Chat>
        ) : (
          <AgentLoading />
        )}
      </div>
      {customerClient && (
        <Chat client={customerClient} theme={`commerce ${theme}`}>
          <CustomerApp />
        </Chat>
      )}
    </>
  );
};

export default App;
