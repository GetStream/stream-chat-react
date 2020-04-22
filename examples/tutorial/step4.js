/* eslint-disable import/no-unresolved */
import React from 'react';
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  MessageInputSmall,
  MessageSimple,
  Thread,
} from 'stream-chat-react';
import { StreamChat } from 'stream-chat';

import 'stream-chat-react/dist/css/index.css';

const chatClient = new StreamChat('qk4nn7rpcn75');

chatClient.setUser(
  {
    id: 'thierry',
    name: 'Thierry',
    image:
      'https://upload.wikimedia.org/wikipedia/en/thumb/2/24/Colorado_Rockies_%28NHL%29_logo.svg/1200px-Colorado_Rockies_%28NHL%29_logo.svg.png',
  },
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGhpZXJyeSJ9.EJ6poZ2UbnJJvbCi6ZiImeEPeIoXVEBSdZN_-2YC3t0',
);

const MessageCompact = MessageSimple;

const channel = chatClient.channel('livestream', 'spacex', {
  image:
    'https://images.unsplash.com/photo-1517976547714-720226b864c1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=3000&q=80',
  name: 'SpaceX launch discussion',
});

const App = () => (
  <Chat client={chatClient} theme={'livestream dark'}>
    <Channel channel={channel} Message={MessageCompact}>
      <ChannelHeader live={true} />
      <MessageList />
      <MessageInput Input={MessageInputSmall} />
      <Thread />
    </Channel>
  </Chat>
);

export default App;
