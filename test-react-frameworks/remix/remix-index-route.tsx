// @ts-nocheck

import { LinksFunction } from '@remix-run/node';
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

const apiKey = process.env.STREAM_API_KEY;
const userId = process.env.USER_ID;
const userToken = process.env.USER_TOKEN;

if (!apiKey || !userId || !userToken)
  throw new Error('Missing either STREAM_API_KEY, USER_ID or USER_TOKEN');

const options = { limit: 10, presence: true, state: true };

import stream from 'stream-chat-react/dist/css/index.css';

export const links: LinksFunction = () => [{ href: stream, rel: 'stylesheet' }];

export default function Index() {
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
      <ChannelList options={options} />
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
