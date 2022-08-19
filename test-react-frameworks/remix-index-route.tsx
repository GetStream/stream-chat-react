import { LinksFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
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

const options = { state: true, presence: true, limit: 10 };

import stream from 'stream-chat-react/dist/css/index.css';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stream }];

export default function Index() {
  const [client, setClient] = React.useState<StreamChat | null>(null);

  React.useEffect(() => {
    const chatClient = StreamChat.getInstance('pnxrtw9c3jeq');

    chatClient
      .connectUser(
        { id: 'test-user-1' },
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGVzdC11c2VyLTEifQ.gRbKDG6PYuqCmvpBHKk4ibdz-WO9YiOTVmpG7gw9o74',
      )
      .then(() => setClient(chatClient));
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
