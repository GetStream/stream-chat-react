import React, { useState } from 'react';
import { Chat, Channel, CustomStyles } from 'stream-chat-react';
import '@stream-io/stream-chat-css/dist/css/index.css';

import { ChannelInner } from './ChannelInner';
import { ChatHeader } from './ChatHeader';
import { ChatSidebar } from './ChatSidebar';
import { DMChannelList } from './DMChannelList';
import { EmptyStateIndicators } from './EmptyStateIndicators';
import { GiphyPreview } from './GiphyPreview';
import { MessageUI } from './MessageUI';
import { MessageInputUI } from './MessageInputUI';
import { ParticipantProfile } from './ParticipantProfile';
import { ParticipantSearch } from './ParticipantSearch';
import { Snackbar } from './Snackbar';
import { SuggestionHeader, SuggestionListItem } from './SuggestionList';
import { ThreadHeader } from './ThreadHeader';
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
  const [messageActionUser, setMessageActionUser] = useState<string>();
  const [participantProfile, setParticipantProfile] = useState<UserResponse>();
  const [snackbar, setSnackbar] = useState(false);

  const {
    chatClient,
    currentChannel,
    dmUnread,
    eventUnread,
    globalUnread,
    qaUnread,
  } = useInitChat();

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
      {isFullScreen && (
        <ChatSidebar
          dmUnread={dmUnread}
          eventUnread={eventUnread}
          globalUnread={globalUnread}
          qaUnread={qaUnread}
        />
      )}
      <div className={`chat-components ${isFullScreen ? 'full-screen' : ''}`}>
        <Chat client={chatClient} customStyles={customStyles}>
          <GiphyContextProvider>
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
                messageActionUser={messageActionUser}
                participantProfile={participantProfile}
                setSnackbar={setSnackbar}
                userActionType={userActionType}
              />
            )}
            {snackbar && userActionType && (
              <Snackbar setSnackbar={setSnackbar} userActionType={userActionType} />
            )}
            <ChatHeader
              dmUnread={dmUnread}
              eventUnread={eventUnread}
              globalUnread={globalUnread}
              qaUnread={qaUnread}
            />
            {showChannelList ? (
              <DMChannelList
                dmChannel={dmChannel}
                setDmChannel={setDmChannel}
                setParticipantProfile={setParticipantProfile}
              />
            ) : (
              currentChannel && (
                <Channel
                  AutocompleteSuggestionHeader={SuggestionHeader}
                  AutocompleteSuggestionItem={SuggestionListItem}
                  channel={currentChannel}
                  EmptyStateIndicator={EmptyStateIndicators}
                  GiphyPreviewMessage={GiphyPreview}
                  Input={MessageInputUI}
                  ThreadHeader={ThreadHeader}
                  VirtualMessage={(props) => (
                    <MessageUI {...props} setMessageActionUser={setMessageActionUser} />
                  )}
                >
                  <ChannelInner />
                </Channel>
              )
            )}
          </GiphyContextProvider>
        </Chat>
      </div>
    </div>
  );
};
