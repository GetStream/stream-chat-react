import React, { useEffect, useState } from 'react';
import { Channel as StreamChannel, StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageInput,
  Thread,
  Window,
  VirtualizedMessageList,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';

import './ChatContainer.scss';
import { ChatHeader } from './ChatHeader';

import { CloseChatButton } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

const urlParams = new URLSearchParams(window.location.search);

const apiKey = urlParams.get('apikey') || (process.env.REACT_APP_STREAM_KEY as string);
const userId = urlParams.get('user') || (process.env.REACT_APP_USER_ID as string);
const userToken = urlParams.get('user_token') || (process.env.REACT_APP_USER_TOKEN as string);

export const ChatContainer: React.FC = () => {
  const { event, isFullScreen } = useEventContext();

  const [chatClient, setChatClient] = useState<StreamChat>();
  const [currentChannel, setCurrentChannel] = useState<StreamChannel>();

  const switchChannel = async (eventName: string) => {
    if (!chatClient) return;

    const newChannel = chatClient.channel('livestream', eventName, { name: eventName });
    await newChannel.watch({ watchers: { limit: 100 } });
    setCurrentChannel(newChannel);
  };

  useEffect(() => {
    const initChat = async () => {
      const client = StreamChat.getInstance(apiKey);

      if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
        client.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
      }

      await client.connectUser({ id: userId }, userToken);

      const globalChannel = client.channel('livestream', 'global', { name: 'global' });
      await globalChannel.watch({ watchers: { limit: 100 } });

      setChatClient(client);
      setCurrentChannel(globalChannel);
    };

    if (!chatClient) {
      initChat();
    } else {
      switchChannel(event);
    }

    return () => {
      chatClient?.disconnectUser();
    };
  }, [event]); // eslint-disable-line

  if (!chatClient) return null;

  return (
    <div className={`chat ${isFullScreen ? 'full-screen' : ''}`}>
      {isFullScreen && <CloseChatButton />}
      <div className={`chat-components ${isFullScreen ? 'full-screen' : ''}`}>
        <Chat client={chatClient}>
          <Channel channel={currentChannel}>
            <Window hideOnThread>
              <ChatHeader />
              <VirtualizedMessageList />
              <MessageInput focus />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
};
