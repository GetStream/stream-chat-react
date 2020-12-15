/* eslint-disable */
import React, { Component } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  MessageInputFlat,
  MessageSimple,
  ChannelHeader,
  ChannelPreviewMessenger,
  InfiniteScrollPaginator,
  ChannelListMessenger,
  ChannelList,
  Window,
  Thread,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

const urlParams = new URLSearchParams(window.location.search);
// const user =
//   urlParams.get('user') || process.env.REACT_APP_CHAT_API_DEFAULT_USER;
const theme = urlParams.get('theme') || 'light';
// const channelName = urlParams.get('channel') || 'demo';
// const userToken =
//   urlParams.get('user_token') ||
//   process.env.REACT_APP_CHAT_API_DEFAULT_USER_TOKEN;
const filters = { type: 'messaging', example: 1 };
const sort = {
  last_message_at: -1,
  updated_at: -1,
  cid: 1,
};
const options = { state: true, watch: true, presence: true };
const Paginator = (props) => (
  <InfiniteScrollPaginator threshold={300} {...props} />
);

class App extends Component {
  constructor(props) {
    super(props);
    this.chatClient = new StreamChat('qk4nn7rpcn75');
    if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
      this.chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
    }
    this.chatClient.setUser(
      {
        id: 'example-user',
      },
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g',
    );
  }

  render() {
    return (
      <Chat client={this.chatClient} theme={`messaging ${theme}`}>
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
          <Thread Message={MessageSimple} />
        </Channel>
      </Chat>
    );
  }
}

export default App;
