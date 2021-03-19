import React from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  ChannelListMessenger,
  ChannelPreviewMessenger,
  MessageInput,
  MessageInputFlat,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

const apiKey = process.env.REACT_APP_STREAM_KEY;
const userId = process.env.REACT_APP_USER_ID;
const userToken = process.env.REACT_APP_USER_TOKEN;
const theme = 'light';

const filters = { type: 'messaging' };
const options = { state: true, presence: true, limit: 10 };
const sort = {
  cid: 1,
  last_message_at: -1,
  updated_at: -1,
};

const chatClient = StreamChat.getInstance(apiKey);

if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
  chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
}

chatClient.connectUser({ id: userId }, userToken);

const App = () => (
  <Chat client={chatClient} theme={`messaging ${theme}`}>
    <ChannelList
      List={ChannelListMessenger}
      Preview={ChannelPreviewMessenger}
      filters={filters}
      sort={sort}
      options={options}
    />
    <Channel>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput Input={MessageInputFlat} focus />
      </Window>
      <Thread />
    </Channel>
  </Chat>
);

export default App;
