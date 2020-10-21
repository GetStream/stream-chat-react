import React from 'react';
import { StreamChat } from 'stream-chat';
import {
  Channel,
  Chat,
  enTranslations,
  MessageList,
  Streami18n,
  Thread,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';

import './App.css';

import { ChannelListContainer } from './components/ChannelListContainer/ChannelListContainer';
import { TeamChannelHeader } from './components/TeamChannelHeader/TeamChannelHeader';
import { TeamMessage } from './components/TeamMessage/TeamMessage';
import { TeamMessageInput } from './components/TeamMessageInput/TeamMessageInput';
import { ThreadMessageInput } from './components/TeamMessageInput/ThreadMessageInput';
import { TeamTypingIndicator } from './components/TeamTypingIndicator/TeamTypingIndicator';

const urlParams = new URLSearchParams(window.location.search);
const apiKey = urlParams.get('apikey') || 'qk4nn7rpcn75';
const user = urlParams.get('user') || 'example-user';
const theme = urlParams.get('theme') || 'light';
const userToken =
  urlParams.get('user_token') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g';

const i18nInstance = new Streami18n({
  language: 'en',
  translationsForLanguage: {
    ...enTranslations,
    '1 reply': '1 thread reply',
    '{{ replyCount }} replies': '{{ replyCount }} thread replies',
  },
});

const App = () => {
  const chatClient = new StreamChat(apiKey);
  chatClient.setUser({ id: user }, userToken);

  return (
    <div style={{ display: 'flex', height: '800px' }}>
      <Chat
        client={chatClient}
        i18nInstance={i18nInstance}
        theme={`team ${theme}`}
      >
        <ChannelListContainer />
        <div className="channel__wrapper">
          <Channel
            onMentionsHover={(e, mentionUser) => console.log(e, mentionUser)}
            onMentionsClick={(e, mentionUser) => console.log(e, mentionUser)}
          >
            <Window>
              <TeamChannelHeader />
              <MessageList
                Message={TeamMessage}
                TypingIndicator={TeamTypingIndicator}
              />
              <TeamMessageInput focus />
            </Window>
            <Thread Message={TeamMessage} MessageInput={ThreadMessageInput} />
          </Channel>
        </div>
      </Chat>
    </div>
  );
};

export default App;
