import React, { useState } from 'react';
import { Chat, Channel, CustomStyles } from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';

import './ChatContainer.scss';
import { ChannelInner } from './ChannelInner';
import { ChatHeader } from './ChatHeader';
import { ChatSidebar } from './ChatSidebar';
import { DMChannelList } from './DMChannelList';
import { MessageInputUI } from './MessageInputUI';
import { ParticipantSearch } from './ParticipantSearch';

import { useEventContext } from '../../contexts/EventContext';
import { GiphyContextProvider } from '../../contexts/GiphyContext';
import { useInitChat } from '../../hooks/useInitChat';

import type { Channel as StreamChannel } from 'stream-chat';

export const ChatContainer: React.FC = () => {
  const { isFullScreen, searching, setSearching, showChannelList } = useEventContext();

  const [dmChannel, setDmChannel] = useState<StreamChannel>();

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
          {searching && (
            <ParticipantSearch setDmChannel={setDmChannel} setSearching={setSearching} />
          )}
          <ChatHeader />
          {showChannelList ? (
            <DMChannelList dmChannel={dmChannel} setDmChannel={setDmChannel} />
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
