/* eslint-disable */
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
// const user =
//   urlParams.get('user') || process.env.REACT_APP_CHAT_API_DEFAULT_USER;
const theme = urlParams.get('theme') || 'light';
const channelName = urlParams.get('channel') || 'demo';
// const userToken =
//   urlParams.get('user_token') ||
//   process.env.REACT_APP_CHAT_API_DEFAULT_USER_TOKEN;

class App extends Component {
  constructor(props) {
    super(props);
    this.chatClient = new StreamChat('qk4nn7rpcn75');
    // this.chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
    this.chatClient.setUser(
      {
        id: 'example-user',
      },
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g',
    );
    this.channel = this.chatClient.channel('commerce', channelName, {
      image: 'https://i.stack.imgur.com/e7G42m.jpg',
      name: 'Hello 👋',
      subtitle: 'Chat with us about NASA stuff!',
      example: 1,
    });

    this.channel.watch();

    this.state = {
      open: true,
    };
  }

  toggleDemo = () => {
    if (this.state.open) {
      this.setState({ open: false });
    } else {
      this.setState({ open: true });
    }
  };

  render() {
    return (
      <>
        <div className={`wrapper ${this.state.open ? 'wrapper--open' : ''}`}>
          <Chat client={this.chatClient} theme={`commerce ${theme}`}>
            <Channel
              channel={this.channel}
              onMentionsHover={(e, user) => console.log(e, user)}
              onMentionsClick={(e, user) => console.log(e, user)}
            >
              <Window>
                <ChannelHeader />
                {this.state.open && (
                  <MessageList
                    TypingIndicator={TypingIndicator}
                    Message={MessageCommerce}
                  />
                )}
                <MessageInput
                  onFocus={!this.state.open ? this.toggleDemo : null}
                  Input={MessageInputFlat}
                  focus
                />
              </Window>
            </Channel>
          </Chat>
          <Button onClick={this.toggleDemo} open={this.state.open} />
        </div>
      </>
    );
  }
}

export default App;

const Button = ({ open, onClick }) => (
  <div
    onClick={onClick}
    className={`button ${open ? 'button--open' : 'button--closed'}`}
  >
    {open ? (
      <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M19.333 2.547l-1.88-1.88L10 8.12 2.547.667l-1.88 1.88L8.12 10 .667 17.453l1.88 1.88L10 11.88l7.453 7.453 1.88-1.88L11.88 10z"
          fillRule="evenodd"
        />
      </svg>
    ) : (
      <svg width="24" height="20" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M.011 20L24 10 .011 0 0 7.778 17.143 10 0 12.222z"
          fillRule="evenodd"
        />
      </svg>
    )}
  </div>
);
