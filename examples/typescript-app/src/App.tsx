import React, { Component } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelSort,
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
const apiKey = urlParams.get('apiKey') || 'qk4nn7rpcn75';
const userId = urlParams.get('user') || 'example-user';
const theme = urlParams.get('theme') || 'light';
const userToken =
  urlParams.get('user_token') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g';

const filters = { type: 'messaging', example: 1 };
const options = { state: true, watch: true, presence: true };
const sort: ChannelSort = {
  last_message_at: -1,
  updated_at: -1,
  cid: 1,
};

class App extends Component {
  chatClient = new StreamChat('');
  constructor(props: Readonly<{}>) {
    super(props);
    this.chatClient = StreamChat.getInstance(apiKey);

    if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
      this.chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
    }

    this.chatClient.connectUser({ id: userId }, userToken);
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
          Paginator={(props) => (
            <InfiniteScrollPaginator threshold={300} {...props} />
          )}
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
