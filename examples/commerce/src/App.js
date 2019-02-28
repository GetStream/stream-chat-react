/* globals process */
import React, { Component } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  MessageInputFlat,
  MessageCommerce,
  ChannelHeader,
  TypingIndicator,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

const urlParams = new URLSearchParams(window.location.search);
const user =
  urlParams.get('user') || process.env.REACT_APP_CHAT_API_DEFAULT_USER;
const channelName = urlParams.get('channel') || 'demo';
const userToken =
  urlParams.get('user_token') ||
  process.env.REACT_APP_CHAT_API_DEFAULT_USER_TOKEN;

class App extends Component {
  constructor(props) {
    super(props);
    this.chatClient = new StreamChat(process.env.REACT_APP_CHAT_API_KEY);
    this.chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
    this.chatClient.setUser(
      {
        id: user,
      },
      userToken,
    );
    this.channel = this.chatClient.channel('messaging', channelName, {
      image: 'https://i.stack.imgur.com/e7G42m.jpg',
      name: 'Hello 👋',
      subtitle: 'Chat with us about NASA stuff!',
      example: 1,
    });

    this.channel.watch();

    const filters = { type: 'messaging', example: 1 };
    const sort = { last_message_at: -1 };
    this.channels = this.chatClient.queryChannels(filters, sort, {
      subscribe: true,
    });
  }

  render() {
    return (
      <>
        <Chat client={this.chatClient} theme="commerce light">
          <Channel channel={this.channel}>
            <Window>
              <ChannelHeader />
              <MessageList
                typingIndicator={TypingIndicator}
                Message={MessageCommerce}
              />
              <MessageInput Input={MessageInputFlat} focus />
            </Window>
          </Channel>
        </Chat>
      </>
    );
  }
}

export default App;
