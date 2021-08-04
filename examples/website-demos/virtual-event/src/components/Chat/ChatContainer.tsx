import React, { useState } from 'react';
import { Chat, Channel, CustomStyles } from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';

import './ChatContainer.scss';
import { ChannelInner } from './ChannelInner';
import { ChatHeader } from './ChatHeader';
import { ChatSidebar } from './ChatSidebar';
import { DMChannelList } from './DMChannelList';
import { MessageInputUI } from './MessageInputUI';
import { ParticipantProfile } from './ParticipantProfile';
import { ParticipantSearch } from './ParticipantSearch';
import { UserActionsModal } from './UserActionsModal';

import { useEventContext } from '../../contexts/EventContext';
import { GiphyContextProvider } from '../../contexts/GiphyContext';
import { useInitChat } from '../../hooks/useInitChat';

import { Channel as StreamChannel, UserResponse } from 'stream-chat';

export const ChatContainer: React.FC = () => {
  const {
    actionsModalOpen,
    isFullScreen,
    searching,
    setSearching,
    showChannelList,
    userActionType,
  } = useEventContext();

  const [dmChannel, setDmChannel] = useState<StreamChannel>();
  const [participantProfile, setParticipantProfile] = useState<UserResponse>();

  const { chatClient, currentChannel } = useInitChat();

  if (!chatClient) return null;

  const customStyles: CustomStyles = {
    '--primary-color': 'var(--primary-accent)',
  };

  return (
    <div
      className={`chat ${isFullScreen ? 'full-screen' : ''} ${
        actionsModalOpen ? 'actions-modal' : ''
      }`}
    >
      {isFullScreen && <ChatSidebar />}
      <div className={`chat-components ${isFullScreen ? 'full-screen' : ''}`}>
        <Chat client={chatClient} customStyles={customStyles}>
          {searching && (
            <ParticipantSearch
              setDmChannel={setDmChannel}
              setParticipantProfile={setParticipantProfile}
              setSearching={setSearching}
            />
          )}
          {participantProfile && (
            <ParticipantProfile
              participantProfile={participantProfile}
              setDmChannel={setDmChannel}
              setParticipantProfile={setParticipantProfile}
            />
          )}
          {actionsModalOpen && userActionType && (
            <UserActionsModal
              dmChannel={dmChannel}
              participantProfile={participantProfile}
              userActionType={userActionType}
            />
          )}
          <ChatHeader />
          {showChannelList ? (
            <DMChannelList
              dmChannel={dmChannel}
              setDmChannel={setDmChannel}
              setParticipantProfile={setParticipantProfile}
            />
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
