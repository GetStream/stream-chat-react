// @ts-nocheck

import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';

import { StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';

const Home: NextPage = ({ apiKey, userId, userToken }) => {
  const [client, setClient] = useState<StreamChat | null>(null);

  const filters: ChannelFilters = { members: { $in: [userId] }, type: 'messaging' };
  const options: ChannelOptions = { limit: 10, presence: true, state: true };
  const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

  useEffect(() => {
    const chatClient = StreamChat.getInstance(apiKey);

    chatClient.connectUser({ id: userId }, userToken).then(() => setClient(chatClient));
  }, []);

  if (client === null) {
    return <div>Loading</div>;
  }

  return (
    <Chat client={client}>
      <ChannelList filters={filters} options={options} sort={sort} />
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput focus />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  );
};

Home.getInitialProps = () => {
  const apiKey = process.env.NEXT_STREAM_API_KEY;
  const userId = process.env.NEXT_USER_ID;
  const userToken = process.env.NEXT_USER_TOKEN;

  return { apiKey, userId, userToken };
};

export default Home;
