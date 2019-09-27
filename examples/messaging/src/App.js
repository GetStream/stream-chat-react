/* globals process */
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
  TypingIndicator,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

const urlParams = new URLSearchParams(window.location.search);
const user =
  urlParams.get('user') || process.env.REACT_APP_CHAT_API_DEFAULT_USER;
const theme = urlParams.get('theme') || 'light';
// const channelName = urlParams.get('channel') || 'demo';
const userToken =
  urlParams.get('user_token') ||
  process.env.REACT_APP_CHAT_API_DEFAULT_USER_TOKEN;

class App extends Component {
  constructor(props) {
    super(props);
    this.chatClient = new StreamChat(process.env.REACT_APP_CHAT_API_KEY);
    if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
      this.chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
    }
    this.chatClient.setUser(
      {
        id: user,
      },
      userToken,
    );
  }

  render() {
    const filters = { type: 'messaging' };
    const sort = {
      last_message_at: -1,
      cid: 1,
    };
    const options = { state: true, watch: true, presence: true };

    return (
      <Chat client={this.chatClient} theme={`messaging ${theme}`}>
        <ChannelList
          List={ChannelListMessenger}
          Preview={ChannelPreviewMessenger}
          filters={filters}
          sort={sort}
          options={options}
          watchers={{ limit: 10 }}
          Paginator={(props) => (
            <InfiniteScrollPaginator threshold={300} {...props} />
          )}
        />
        <Channel>
          <Window>
            <ChannelHeader />
            <MessageList TypingIndicator={TypingIndicator} />
            <MessageInput Input={MessageInputFlat} focus />
          </Window>
          <Thread Message={MessageSimple} />
        </Channel>
      </Chat>
    );
  }
}

export default App;
