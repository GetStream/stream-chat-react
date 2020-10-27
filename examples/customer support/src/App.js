import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageCommerce,
  MessageList,
  MessageInput,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';

import './App.css';

import { EmptyStateIndicator } from './components/EmptyStateIndicator/EmptyStateIndicator';
import { SupportChannelHeader } from './components/ChannelHeader/SupportChannelHeader';
import { SupportMessageInput } from './components/MessageInput/SupportMessageInput';

import { ToggleButton } from './assets/ToggleButton';

const urlParams = new URLSearchParams(window.location.search);
const apiKey = urlParams.get('apikey') || 'qk4nn7rpcn75';
const user = urlParams.get('user') || 'example-user';
const theme = urlParams.get('theme') || 'light';
const channelId = urlParams.get('channel') || 'support-demo';
const userToken =
  urlParams.get('user_token') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g';

const App = () => {
  const [channel, setChannel] = useState();
  const [open, setOpen] = useState(false);

  const chatClient = new StreamChat(apiKey);
  chatClient.setUser({ id: user }, userToken);

  useEffect(() => {
    const getChannel = async () => {
      const [existingChannel] = await chatClient.queryChannels({
        id: channelId,
      });

      if (existingChannel) await existingChannel.delete();

      const newChannel = chatClient.channel('commerce', channelId, {
        image: 'https://i.stack.imgur.com/e7G42m.jpg',
        name: 'Hello',
        subtitle: 'We are here to help.',
        example: 1,
      });

      await newChannel.watch();

      setChannel(newChannel);
      setOpen(true);
    };

    if (chatClient) {
      getChannel();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDemo = () => setOpen(!open);

  return (
    <div className={`wrapper ${open ? 'wrapper--open' : ''}`}>
      <Chat client={chatClient} theme={`commerce ${theme}`}>
        {channel && (
          <Channel channel={channel}>
            <Window>
              <SupportChannelHeader />
              {open && (
                <div style={{ background: '#005fff' }}>
                  <MessageList
                    EmptyStateIndicator={(props) => (
                      <EmptyStateIndicator {...props} channel={channel} />
                    )}
                    Message={MessageCommerce}
                  />
                </div>
              )}
              <MessageInput
                onFocus={!open ? toggleDemo : null}
                Input={SupportMessageInput}
                focus
              />
            </Window>
          </Channel>
        )}
      </Chat>
      <ToggleButton onClick={toggleDemo} open={open} />
    </div>
  );
};

export default App;
