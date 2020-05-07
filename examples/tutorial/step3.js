/* eslint-disable import/no-unresolved */
import React from 'react';
import {
  Chat,
  Channel,
  ChannelList,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
} from 'stream-chat-react';
import { StreamChat } from 'stream-chat';

import 'stream-chat-react/dist/css/index.css';

const chatClient = new StreamChat('qk4nn7rpcn75');

class MyChannelPreview extends React.Component {
  render() {
    return (
      <div className="channel_preview">
        <a
          href="#"
          onClick={this.props.setActiveChannel.bind(this, this.props.channel)}
        >
          {this.props.channel.data.name}
        </a>

        <span>
          {this.props.lastMessageText}
          Unread Count: {this.props.unread}
        </span>
      </div>
    );
  }
}

// the most minimalistic message component
class MyMessage extends React.Component {
  render() {
    return <div>{this.props.message.text}</div>;
  }
}

chatClient.setUser(
  {
    id: 'thierry',
    name: 'Thierry',
    image:
      'https://upload.wikimedia.org/wikipedia/en/thumb/2/24/Colorado_Rockies_%28NHL%29_logo.svg/1200px-Colorado_Rockies_%28NHL%29_logo.svg.png',
  },
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGhpZXJyeSJ9.EJ6poZ2UbnJJvbCi6ZiImeEPeIoXVEBSdZN_-2YC3t0',
);

const filters = {};
const sort = { last_message_at: -1 };
const channels = chatClient.queryChannels(filters, sort);

const App = () => (
  <Chat client={chatClient} theme={'messaging light'}>
    <ChannelList channels={channels} Preview={MyChannelPreview} />
    <Channel Message={MyMessage}>
      <ChannelHeader />
      <MessageList />
      <MessageInput />
      <Thread />
    </Channel>
  </Chat>
);

export default App;
