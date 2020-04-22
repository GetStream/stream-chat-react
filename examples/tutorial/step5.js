/* eslint-disable import/no-unresolved */
import React from 'react';
import {
  Chat,
  Channel,
  Attachment,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
} from 'stream-chat-react';
import { StreamChat } from 'stream-chat';

import 'stream-chat-react/dist/css/index.css';

const chatClient = new StreamChat('qk4nn7rpcn75');

class MyAttachment extends React.Component {
  render() {
    const a = this.props.attachment;
    if (a.type === 'product') {
      return (
        <div className="product">
          Product:
          <a
            href={this.props.attachment.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={this.props.attachment.image} height={'100px'} />
            <br />
            {this.props.attachment.name}
          </a>
        </div>
      );
    }
    return (
      <div>
        testing
        <Attachment {...this.props} />
      </div>
    );
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

const channel = chatClient.channel('team', 'godevs', {
  // add as many custom fields as you'd like
  image:
    'https://cdn.chrisshort.net/testing-certificate-chains-in-go/GOPHER_MIC_DROP.png',
  name: 'Talk about Go',
});

const attachments = [
  {
    type: 'product',
    name: 'iPhone',
    url:
      'https://www.amazon.com/Apple-iPhone-Fully-Unlocked-256GB/dp/B0775451TT/',
    image:
      'https://images-na.ssl-images-amazon.com/images/I/71k0cry-ceL._SL1500_.jpg',
  },
];

channel.sendMessage({
  text:
    'Your selected product is out of stock, would you like to select one of these alternatives?',
  attachments,
});

const App = () => (
  <Chat client={chatClient} theme={'livestream dark'}>
    <Channel channel={channel} Attachment={MyAttachment}>
      <ChannelHeader />
      <MessageList />
      <MessageInput />
      <Thread />
    </Channel>
  </Chat>
);

export default App;
