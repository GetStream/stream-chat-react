import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';

import { rooms } from './data';
import { EventCard } from './EventCard';
import { RoomVideo } from './RoomVideo';

import { CalendarButton } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

export const RoomsList = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { setChatType, setEventName, setVideoOpen, videoOpen } = useEventContext();

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkIfClickedOutside = (event: MouseEvent) => {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        event.target instanceof Element &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('click', checkIfClickedOutside);
    return () => {
      document.removeEventListener('click', checkIfClickedOutside);
    };
  }, [dropdownOpen]);

  const handleBackArrow = (event: BaseSyntheticEvent) => {
    setChatType('global');
    setEventName(undefined);
    setVideoOpen(false);
  };

  const calendarClick = (event: BaseSyntheticEvent) => {
    event.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  const variants: Variants = {
    open: { opacity: 1, height: '660px' },
    closed: { opacity: 0, height: 0 },
  };

  return (
    <>
      <div className='rooms-list-header'>
        <div className='rooms-list-header-title'>
          <div className='rooms-list-header-title-main'>World Hacker Summit 2021</div>
          <div className='rooms-list-header-title-sub'>Presented by Stream</div>
        </div>
        <div className='rooms-list-header-calendar' onClick={calendarClick}>
          <CalendarButton />
        </div>
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              className='rooms-list-dropdown'
              ref={dropdownRef}
              variants={variants}
              initial='closed'
              animate='open'
              exit='closed'
            >
              {rooms.map((room, i) => (
                <div className='rooms-list-card' key={i}>
                  <EventCard
                    chatType={room.chatType}
                    content={room.content}
                    eventName={room.eventName}
                    eventNumber={i}
                    label={room.label}
                    presenters={room.presenters}
                    title={room.title}
                    viewers={room.viewers}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className={`rooms-list-video${videoOpen ? '' : '-hidden'}`}>
        <RoomVideo handleBackArrow={handleBackArrow} />
      </div>
      <div className={`rooms-list-container${videoOpen ? '-hidden' : ''}`}>
        <div className='rooms-list-container-cards'>
          {rooms.map((room, i) => (
            <div className='rooms-list-card' key={i}>
              <EventCard
                chatType={room.chatType}
                content={room.content}
                eventName={room.eventName}
                eventNumber={i}
                jpeg={room.jpeg}
                label={room.label}
                presenters={room.presenters}
                title={room.title}
                viewers={room.viewers}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
