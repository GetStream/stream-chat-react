import React from 'react';

import { CloseChatButton, OnlineUsersIcon } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

type Props = {
  dmUnread: boolean;
  eventUnread: boolean;
  globalUnread: boolean;
  qaUnread: boolean;
};

export const ChatHeader: React.FC<Props> = (props) => {
  const { dmUnread, eventUnread, globalUnread, qaUnread } = props;

  const { chatType, eventName, selected, setChatType, setShowChannelList } = useEventContext();

  const handleGlobalClick = () => {
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
    <div className='chat-components-header'>
      <div className='chat-components-header-top'>
        <CloseChatButton />
        <OnlineUsersIcon />
      </div>
      <div className='chat-components-header-tabs'>
        <div className='chat-components-header-tabs-item' onClick={handleGlobalClick}>
          <div className={`${chatType === 'global' ? 'selected' : ''}`} />
          <div>Global</div>
          <div className={`${globalUnread && chatType !== 'global' ? 'unread' : ''}`} />
        </div>
        {selected !== 'overview' && eventName && (
          <div className='chat-components-header-tabs-item' onClick={handleEventClick}>
            <div
              className={`${chatType === 'main-event' || chatType === 'room' ? 'selected' : ''}`}
            />
            <div>{selected === 'main-event' ? 'Event' : 'Room'}</div>
            <div
              className={`${
                eventUnread && chatType !== 'main-event' && chatType !== 'room' ? 'unread' : ''
              }`}
            />
          </div>
        )}
        <div className='chat-components-header-tabs-item' onClick={handleDirectClick}>
          <div className={`${chatType === 'direct' ? 'selected' : ''}`} />
          <div>DM</div>
          <div className={`${dmUnread && chatType !== 'direct' ? 'unread' : ''}`} />
        </div>
        <div className='chat-components-header-tabs-item' onClick={handleQAClick}>
          <div className={`${chatType === 'qa' ? 'selected' : ''}`} />
          <div>Q&A</div>
          <div className={`${qaUnread && chatType !== 'qa' ? 'unread' : ''}`} />
        </div>
      </div>
    </div>
  );
};
