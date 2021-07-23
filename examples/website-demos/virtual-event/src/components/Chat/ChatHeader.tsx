import React from 'react';

import { CloseChatButton, OnlineUsersIcon } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';
import { DMChannelHeader } from './DMChannelHeader';

const ChatHeaderTabs: React.FC = () => {
  const {
    chatType,
    eventName,
    selected,
    setChatType,
    setEventName,
    setShowChannelList,
  } = useEventContext();

  const handleGlobalClick = () => {
    setEventName(undefined);
    setChatType('global');
    setShowChannelList(false);
  };

  const handleEventClick = () => {
    const eventType = selected === 'main-event' ? 'main-event' : 'room';
    setChatType(eventType);
    setShowChannelList(false);
  };

  const handleDirectClick = () => {
    setChatType('direct');
    setShowChannelList(true);
  };

  const handleQAClick = () => {
    setChatType('qa');
    setShowChannelList(false);
  };

  return (
    <div className='chat-components-header-tabs'>
      <div className='chat-components-header-tabs-item' onClick={handleGlobalClick}>
        <div className={`${chatType === 'global' ? 'selected' : ''}`} />
        <div>Global</div>
      </div>
      {selected !== 'overview' && eventName && (
        <div className='chat-components-header-tabs-item' onClick={handleEventClick}>
          <div
            className={`${chatType === 'main-event' || chatType === 'room' ? 'selected' : ''}`}
          />
          <div>{selected === 'main-event' ? 'Event' : 'Room'}</div>
        </div>
      )}
      <div className='chat-components-header-tabs-item' onClick={handleDirectClick}>
        <div className={`${chatType === 'direct' ? 'selected' : ''}`} />
        <div>DM</div>
      </div>
      <div className='chat-components-header-tabs-item' onClick={handleQAClick}>
        <div className={`${chatType === 'qa' ? 'selected' : ''}`} />
        <div>Q&A</div>
      </div>
    </div>
  );
};

export const ChatHeader: React.FC = () => {
  const { dmChannel } = useEventContext();

  return (
    <div className='chat-components-header'>
      {dmChannel ? (
        <DMChannelHeader />
      ) : (
        <>
          <div className='chat-components-header-top'>
            <CloseChatButton />
            <OnlineUsersIcon />
          </div>
          <ChatHeaderTabs />
        </>
      )}
    </div>
  );
};
