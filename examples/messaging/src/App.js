import React from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  ChannelListMessenger,
  ChannelPreviewMessenger,
  InfiniteScrollPaginator,
  MessageInput,
  MessageInputFlat,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';

import './App.css';

const urlParams = new URLSearchParams(window.location.search);
const apiKey = urlParams.get('apiKey') || 'qk4nn7rpcn75';
const userId = urlParams.get('user') || 'example-user';
const theme = urlParams.get('theme') || 'light';
const userToken =
  urlParams.get('user_token') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g';

const filters = { type: 'messaging', example: 1 };
const options = { state: true, watch: true, presence: true };
const sort = {
  cid: 1,
  last_message_at: -1,
  updated_at: -1,
};

const Paginator = (props) => (
  <InfiniteScrollPaginator threshold={300} {...props} />
);

const chatClient = new StreamChat(apiKey);

if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
  chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
}

chatClient.setUser({ id: userId }, userToken);

const App = () => (
  <Chat client={chatClient} theme={`messaging ${theme}`}>
    <ChannelList
      List={ChannelListMessenger}
      Preview={ChannelPreviewMessenger}
      filters={filters}
      sort={sort}
      options={options}
      Paginator={Paginator}
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
