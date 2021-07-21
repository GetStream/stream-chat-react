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
import { ChatSidebar } from './ChatSidebar';
import { DMChannelList } from './DMChannelList';
import { EmptyStateIndicators } from './EmptyStateIndicators';
import { MessageInputUI } from './MessageInputUI';

import { ChatType, useEventContext } from '../../contexts/EventContext';

const urlParams = new URLSearchParams(window.location.search);

const apiKey = urlParams.get('apikey') || (process.env.REACT_APP_STREAM_KEY as string);
const userId = urlParams.get('user') || (process.env.REACT_APP_USER_ID as string);
const userToken = urlParams.get('user_token') || (process.env.REACT_APP_USER_TOKEN as string);

export const ChatContainer: React.FC = () => {
  const { chatType, eventName, isFullScreen, showChannelList } = useEventContext();

  const [chatClient, setChatClient] = useState<StreamChat>();
  const [currentChannel, setCurrentChannel] = useState<StreamChannel>();

  const switchChannel = async (type: ChatType, event?: string) => {
    if (!chatClient || type === 'direct') return;

    const channelId = event ? `${type}-${event}` : type;
    const newChannel = chatClient.channel('livestream', channelId);

    await newChannel.watch({ watchers: { limit: 100 } });
    setCurrentChannel(newChannel);
  };

  useEffect(() => {
    const initChat = async () => {
      const client = StreamChat.getInstance(apiKey);

      if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
        client.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
      }

      await client.connectUser(
        {
          id: userId,
          name: userId,
          image: process.env.REACT_APP_USER_IMAGE,
        },
        userToken,
      );

      const globalChannel = client.channel('livestream', 'global', { name: 'global' });
      await globalChannel.watch({ watchers: { limit: 100 } });

      setChatClient(client);
      setCurrentChannel(globalChannel);
    };

    if (!chatClient) {
      initChat();
    } else {
      switchChannel(chatType, eventName);
    }
  }, [chatType, eventName]); // eslint-disable-line

  useEffect(() => {
    return () => {
      chatClient?.disconnectUser();
      setChatClient(undefined);
      setCurrentChannel(undefined);
    };
  }, []); // eslint-disable-line

  if (!chatClient) return null;

  return (
    <div className={`chat ${isFullScreen ? 'full-screen' : ''}`}>
      {isFullScreen && <ChatSidebar />}
      <div className={`chat-components ${isFullScreen ? 'full-screen' : ''}`}>
        <Chat client={chatClient}>
          <ChatHeader />
          {showChannelList ? (
            <DMChannelList />
          ) : (
            <Channel
              channel={currentChannel}
              EmptyStateIndicator={EmptyStateIndicators}
              Input={MessageInputUI}
            >
              <Window hideOnThread>
                <VirtualizedMessageList hideDeletedMessages />
                <MessageInput maxRows={2} grow />
              </Window>
              <Thread />
            </Channel>
          )}
        </Chat>
      </div>
    </div>
  );
};
