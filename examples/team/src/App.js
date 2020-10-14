import React from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  ChannelHeader,
  MessageTeam,
  Window,
  Thread,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';

import './App.css';

import { TeamTypingIndicator } from './components/TeamTypingIndicator';
import { ChannelListContainer } from './components/ChannelListContainer';

const urlParams = new URLSearchParams(window.location.search);
const apiKey = urlParams.get('apikey') || 'qk4nn7rpcn75';
const user = urlParams.get('user') || {
  id: 'example-user',
};
const theme = urlParams.get('theme') || 'light';
const userToken =
  urlParams.get('user_token') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g';

const App = () => {
  const chatClient = new StreamChat(apiKey);

  chatClient.setUser(user, userToken);

  return (
    <Chat client={chatClient} theme={`team ${theme}`}>
      <div style={{ display: 'flex' }}>
        <ChannelListContainer />
        <div style={{ height: '800px', width: '100%' }}>
          <Channel
            onMentionsHover={(e, user) => console.log(e, user)}
            onMentionsClick={(e, user) => console.log(e, user)}
          >
            <Window>
              <ChannelHeader />
              <MessageList
                Message={MessageTeam}
                TypingIndicator={TeamTypingIndicator}
              />
              <MessageInput focus />
            </Window>
            <Thread Message={MessageTeam} />
          </Channel>
        </div>
      </div>
    </Chat>
  );
};

export default App;
