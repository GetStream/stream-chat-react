import React from 'react';

import { CloseChatButton } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

const ChatHeaderTabs = () => {
  const { chatType, eventName, selected, setChatType, setEventName } = useEventContext();

  const handleGlobalClick = () => {
    setEventName(undefined);
    setChatType('global');
  };

  const handleEventClick = () => {
    const eventType = selected === 'main-event' ? 'main-event' : 'room';
    setChatType(eventType);
  };

  const handleDirectClick = () => {
    console.log('direct click');
  };

  const handleQAClick = () => {
    setChatType('qa');
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
  return (
    <div className='chat-components-header'>
      <div className='chat-components-header-top'>
        <CloseChatButton />
      </div>
      <ChatHeaderTabs />
    </div>
  );
};
