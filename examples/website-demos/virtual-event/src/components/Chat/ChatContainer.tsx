import React from 'react';
import { Chat, Channel, CustomStyles } from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';

import './ChatContainer.scss';
import { ChannelInner } from './ChannelInner';
import { ChatHeader } from './ChatHeader';
import { ChatSidebar } from './ChatSidebar';
import { DMChannelList } from './DMChannelList';
import { MessageInputUI } from './MessageInputUI';

import { useEventContext } from '../../contexts/EventContext';
import { GiphyContextProvider } from '../../contexts/GiphyContext';
import { useInitChat } from '../../hooks/useInitChat';

export const ChatContainer: React.FC = () => {
  const { isFullScreen, showChannelList } = useEventContext();

  const { chatClient, currentChannel } = useInitChat();

  if (!chatClient) return null;

  const customStyles: CustomStyles = {
    '--primary-color': 'var(--primary-accent)',
  };

  return (
    <div className={`chat ${isFullScreen ? 'full-screen' : ''}`}>
      {isFullScreen && <ChatSidebar />}
      <div className={`chat-components ${isFullScreen ? 'full-screen' : ''}`}>
        <Chat client={chatClient} customStyles={customStyles}>
          <ChatHeader />
          {showChannelList ? (
            <DMChannelList />
          ) : (
            currentChannel && (
              <Channel channel={currentChannel} Input={MessageInputUI}>
                <GiphyContextProvider>
                  <ChannelInner />
                </GiphyContextProvider>
              </Channel>
            )
          )}
        </Chat>
      </div>
    </div>
  );
};
