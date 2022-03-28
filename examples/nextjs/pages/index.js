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

const apiKey = process.env.NEXT_PUBLIC_REACT_APP_STREAM_KEY;
const userId = process.env.NEXT_PUBLIC_REACT_APP_USER_ID;
const userToken = process.env.NEXT_PUBLIC_REACT_APP_USER_TOKEN;

const filters = { type: 'messaging', members: {$in: [userId]}  };
const options = { state: true, presence: true, limit: 10 };
const sort = { last_message_at: -1, updated_at: -1 };

const chatClient = StreamChat.getInstance(apiKey);

if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
  chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
}

if (typeof window !== 'undefined') {
  chatClient.connectUser({ id: userId }, userToken);
}

const App = () => (
  <Chat client={chatClient}>
    <ChannelList filters={filters} options={options} showChannelSearch sort={sort} />
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

export default App;
