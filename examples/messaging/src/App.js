/* eslint-disable */
import React, { Component } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  MessageSimple,
  ChannelPreviewMessenger,
  InfiniteScrollPaginator,
  ChannelList,
  Window,
  Thread,
} from 'stream-chat-react';
import {
  MessagingInput,
  MessagingChannelHeader,
  MessagingChannelList,
  MessagingCreateChannel
} from './components';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

const urlParams = new URLSearchParams(window.location.search);
const apiKey = urlParams.get('apikey') || 'qk4nn7rpcn75';
  urlParams.get('user') || 'example-user';
const user =
  urlParams.get('user') || 'example-user';
const theme = urlParams.get('theme') || 'dark';
const userToken =
  urlParams.get('user_token') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g';

const filters = { type: 'messaging', members: { $in: [user] }};
const sort = {
  last_message_at: -1,
  updated_at: -1,
  cid: 1,
};

const options = { state: true, watch: true, presence: true,   limit: 10
};
const Paginator = (props) => (
  <InfiniteScrollPaginator threshold={300} {...props} />
);

class App extends Component {
  constructor(props) {
    super(props);
    this.chatClient = new StreamChat(apiKey);
    // if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
    //   this.chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
    // }
    this.chatClient.setUser(
      {
        id: user,
      },
      userToken,
    );
    this.state = {
      createChannel: false
    }
  }

  onClose = () => {
    this.setState({
      createChannel: false,
    });
  }

  onOpen = () => {
    this.setState({
      createChannel: true,
    });
  }

  render() {
    return (
      <Chat client={this.chatClient} theme={`messaging ${theme}`}>
        <ChannelList
          List={(props) => <MessagingChannelList {...props} onCreateChannel={this.onOpen}/>}
          Preview={ChannelPreviewMessenger}
          filters={filters}
          sort={sort}
          options={options}
          // Paginator={Paginator}
        />
        <Channel maxNumberOfFiles={10} multipleUploads={true}>
          <MessagingCreateChannel onClose={this.onClose} visible={this.state.createChannel} />
          <Window>
            <MessagingChannelHeader />
            <MessageList TypingIndicator={() => null} />
            <MessageInput focus />
          </Window>
          <Thread
            Message={MessageSimple}
            additionalMessageInputProps={{
              Input: MessagingInput,
            }}
          />
        </Channel>
      </Chat>
    );
  }
}

export default App;
