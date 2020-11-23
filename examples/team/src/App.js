import React, { useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, enTranslations, Streami18n } from 'stream-chat-react';
import { createGlobalStyle } from 'styled-components';
import 'stream-chat-react/dist/css/index.css';

import './App.css';

import { ChannelContainer } from './components/ChannelContainer/ChannelContainer';
import { ChannelListContainer } from './components/ChannelListContainer/ChannelListContainer';
import { ColorSlider } from './components/ColorSlider/ColorSlider';

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
    // '1 reply': '1 thread reply',
    // '{{ replyCount }} replies': '{{ replyCount }} thread replies',
  },
});

const GlobalColor = createGlobalStyle`
  body {
    --primary-color: ${(props) => props.color};
  }
`;

const filters = [{ type: 'team' }, { type: 'messaging' }];
const options = { state: true, watch: true, presence: true, limit: 3 };
const sort = { last_message_at: -1, updated_at: -1 };

const App = () => {
  const [createType, setCreateType] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('78, 29, 157');

  const client = new StreamChat(apiKey);
  client.setUser({ id: user }, userToken);

  return (
    <>
      <GlobalColor color={primaryColor} />
      <ColorSlider {...{ primaryColor, setPrimaryColor }} />
      <div className="app__wrapper">
        <Chat {...{ client, i18nInstance }} theme={`team ${theme}`}>
          <ChannelListContainer
            {...{
              isCreating,
              filters,
              options,
              setCreateType,
              setIsCreating,
              setIsEditing,
              sort,
            }}
          />
          <ChannelContainer
            {...{
              createType,
              isCreating,
              isEditing,
              setIsCreating,
              setIsEditing,
            }}
          />
        </Chat>
      </div>
    </>
  );
};

export default App;
