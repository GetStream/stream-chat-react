import React from 'react';
import { ChannelFilters, ChannelOptions, ChannelSort, StreamChat } from 'stream-chat';
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
import 'stream-chat-css/dist/css/index.css';

const apiKey = import.meta.env.VITE_STREAM_KEY as string;
const userId = import.meta.env.VITE_USER_ID as string;
const userToken = import.meta.env.VITE_USER_TOKEN as string;

const filters: ChannelFilters = { type: 'messaging' };
const options: ChannelOptions = { limit: 10, presence: true, state: true };
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

const chatClient = StreamChat.getInstance(apiKey);

if (import.meta.env.VITE_CHAT_SERVER_ENDPOINT) {
  chatClient.setBaseURL(import.meta.env.VITE_CHAT_SERVER_ENDPOINT as string);
}

chatClient.connectUser({ id: userId }, userToken);

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
