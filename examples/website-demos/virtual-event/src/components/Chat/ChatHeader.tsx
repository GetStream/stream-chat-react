import React from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';

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

  const variants: Variants = {
    open: { opacity: 1, y: 0, zIndex: 1 },
    closed: { opacity: 0, y: -4, zIndex: -1 },
  };

  return (
    <div className='chat-components-header'>
      <div className='chat-components-header-top'>
        <CloseChatButton />
        <OnlineUsersIcon />
      </div>
      <div className='chat-components-header-tabs'>
        <div className='chat-components-header-tabs-item' onClick={handleGlobalClick}>
          <AnimatePresence>
            {chatType === 'global' && (
              <motion.div
                className='selected'
                variants={variants}
                initial='closed'
                animate='open'
                exit='closed'
              />
            )}
          </AnimatePresence>
          <div>Global</div>
          <div className={`${globalUnread && chatType !== 'global' ? 'unread' : ''}`} />
        </div>
        {selected !== 'overview' && eventName && (
          <div className='chat-components-header-tabs-item' onClick={handleEventClick}>
            <AnimatePresence>
              {(chatType === 'main-event' || chatType === 'room') && (
                <motion.div
                  className='selected'
                  variants={variants}
                  initial='closed'
                  animate='open'
                  exit='closed'
                />
              )}
            </AnimatePresence>
            <div>{selected === 'main-event' ? 'Event' : 'Room'}</div>
            <div
              className={`${
                eventUnread && chatType !== 'main-event' && chatType !== 'room' ? 'unread' : ''
              }`}
            />
          </div>
        )}
        <div className='chat-components-header-tabs-item' onClick={handleDirectClick}>
          <AnimatePresence>
            {chatType === 'direct' && (
              <motion.div
                className='selected'
                variants={variants}
                initial='closed'
                animate='open'
                exit='closed'
              />
            )}
          </AnimatePresence>
          <div>DM</div>
          <div className={`${dmUnread && chatType !== 'direct' ? 'unread' : ''}`} />
        </div>
        <div className='chat-components-header-tabs-item' onClick={handleQAClick}>
          <AnimatePresence>
            {chatType === 'qa' && (
              <motion.div
                className='selected'
                variants={variants}
                initial='closed'
                animate='open'
                exit='closed'
              />
            )}
          </AnimatePresence>
          <div>Q&A</div>
          <div className={`${qaUnread && chatType !== 'qa' ? 'unread' : ''}`} />
        </div>
      </div>
    </div>
  );
};
