import React, { useContext, useEffect, useState } from 'react';
import {
  Channel,
  Window,
  MessageList,
  MessageCommerce,
  MessageInput,
  ChatContext,
} from 'stream-chat-react';

import { AgentHeader } from './components/AgentHeader/AgentHeader';
import { AgentChannelListContainer } from './components/AgentChannelListContainer/AgentChannelListContainer';

const agentChannelId = 'agent-demo';

export const AgentApp = () => {
  const { client: agentClient, setActiveChannel } = useContext(ChatContext);

  const [agentChannel, setAgentChannel] = useState();

  useEffect(() => {
    const getAgentChannel = async () => {
      const [existingChannel] = await agentClient.queryChannels({
        id: agentChannelId,
      });

      if (existingChannel) await existingChannel.delete();

      const newChannel = await agentClient.channel('commerce', agentChannelId, {
        image: require('./assets/jen-avatar.png'), // eslint-disable-line global-require
        name: 'Jen Alexander',
        subtitle: '#572 Enterprise Inquiry',
      });

      await newChannel.watch();

      setAgentChannel(newChannel);
      setActiveChannel(newChannel);
    };

    if (agentClient) {
      getAgentChannel();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sendMessages = async () => {
      await agentChannel.sendMessage({
        text: 'I have a question about Enterprise',
      });

      await agentChannel.sendMessage({
        text:
          'My company is looking to upgrade our account to Enterprise. Can you provide me with some additional pricing information?',
      });
    };

    if (agentChannel && !agentChannel.state.messages.length) {
      sendMessages();
    }
  }, [agentChannel]);

  return (
    <div className="agent-wrapper">
      <AgentHeader />
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
    </div>
  );
};
