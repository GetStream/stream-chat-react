import React, { Component } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  ChannelHeader,
  ChannelListTeam,
  InfiniteScrollPaginator,
  ChannelList,
  MessageTeam,
  Window,
  Thread,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

const urlParams = new URLSearchParams(window.location.search);
const apiKey =
  urlParams.get('apiKey') || process.env.REACT_APP_STREAM_KEY || 'qk4nn7rpcn75';
const userId =
  urlParams.get('user') || process.env.REACT_APP_USER_ID || 'example-user';
const theme = urlParams.get('theme') || 'light';
const userToken =
  urlParams.get('user_token') ||
  process.env.REACT_APP_USER_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g';

const filters = { type: 'team' };
const options = { member: true, watch: true, limit: 10 };
const sort = { last_message_at: -1, cid: 1 };

const Paginator = (props) => (
  <InfiniteScrollPaginator threshold={300} {...props} />
);

class App extends Component {
  constructor(props) {
    super(props);
    this.chatClient = StreamChat.getInstance(apiKey);

    if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
      this.chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
    }

    this.chatClient.connectUser({ id: userId }, userToken);
  }

  render() {
    return (
      <Chat client={this.chatClient} theme={`team ${theme}`}>
        <ChannelList
          filters={filters}
          sort={sort}
          options={options}
          List={ChannelListTeam}
          Paginator={Paginator}
        />
        <Channel
          onMentionsHover={(e, user) => console.log(e, user)}
          onMentionsClick={(e, user) => console.log(e, user)}
        >
          <Window>
            <ChannelHeader />
            <MessageList Message={MessageTeam} />
            <MessageInput focus />
          </Window>
          <Thread Message={MessageTeam} />
        </Channel>
      </Chat>
    );
  }
}

export default App;
