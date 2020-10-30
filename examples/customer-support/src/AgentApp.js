import React, { useEffect } from 'react';
import { Chat } from 'stream-chat-react';

import { AgentHeader } from './components/AgentHeader/AgentHeader';
import { AgentChannelListContainer } from './components/AgentChannelList/AgentChannelListContainer';

const agentChannelId = 'agent-demo';

export const AgentApp = ({ agentClient }) => {
  useEffect(() => {
    const getAgentChannel = async () => {
      const [existingChannel] = await agentClient.queryChannels({
        id: agentChannelId,
      });

      if (existingChannel) await existingChannel.delete();

      const newChannel = agentClient.channel('commerce', agentChannelId, {
        image: 'https://i.stack.imgur.com/e7G42m.jpg',
        name: 'Jen Alexander',
        subtitle: 'We are here to help.',
      });

      await newChannel.watch();

      await newChannel.sendMessage({
        text: 'I have a question about Enterprise',
      });
      await newChannel.sendMessage({
        text:
          'My company is looking to upgrade our account to Enterprise. Can you provide me with some additional pricing information?',
      });
    };

    if (agentClient) {
      getAgentChannel();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="agent-wrapper">
      <Chat client={agentClient}>
        <AgentHeader />
        <AgentChannelListContainer />
      </Chat>
    </div>
  );
};
