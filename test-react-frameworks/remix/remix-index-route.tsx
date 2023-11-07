// @ts-nocheck

import { json, LinksFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import React from 'react';

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

// eslint-disable-next-line require-await
export async function loader() {
  return json({
    apiKey: process.env.REMIX_STREAM_API_KEY,
    userId: process.env.REMIX_USER_ID,
    userToken: process.env.REMIX_USER_TOKEN,
  });
}

import stream from 'stream-chat-react/dist/css/index.css';

export const links: LinksFunction = () => [{ href: stream, rel: 'stylesheet' }];

export default function Index() {
  const { apiKey, userId, userToken } = useLoaderData();

  const filters: ChannelFilters = { members: { $in: [userId] }, type: 'messaging' };
  const options: ChannelOptions = { limit: 10, presence: true, state: true };
  const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

  const [client, setClient] = React.useState<StreamChat | null>(null);

  React.useEffect(() => {
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
}
