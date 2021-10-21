import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';

import { mainEvents } from './data';
import { EventCard } from './EventCard';
import { RoomVideo } from './RoomVideo';

import { CalendarButton } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

export const EventsList = () => {
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

  const currentEvents = [mainEvents[0], mainEvents[1]];
  const upcomingEvents = [mainEvents[2], mainEvents[3]];

  const variants: Variants = {
    open: { opacity: 1, height: '660px' },
    closed: { opacity: 0, height: 0 },
  };

  return (
    <>
      <div className='events-list-header'>
        <div className='events-list-header-title'>
          <div className='events-list-header-title-main'>World Hacker Summit 2021</div>
          <div className='events-list-header-title-sub'>Presented by Stream</div>
        </div>
        <div className='events-list-header-calendar' onClick={calendarClick}>
          <CalendarButton />
        </div>
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              className='events-list-dropdown'
              ref={dropdownRef}
              variants={variants}
              initial='closed'
              animate='open'
              exit='closed'
            >
              {currentEvents.map((event, i) => (
                <div className='events-list-card' key={i}>
                  <EventCard
                    chatType={event.chatType}
                    content={event.content}
                    eventName={event.eventName}
                    eventNumber={i}
                    label={event.label}
                    presenters={event.presenters}
                    title={event.title}
                    viewers={event.viewers}
                  />
                </div>
              ))}
              {upcomingEvents.map((event, i) => (
                <div className='events-list-card' key={i}>
                  <EventCard
                    chatType={event.chatType}
                    content={event.content}
                    eventName={event.eventName}
                    eventNumber={i + 2}
                    label={event.label}
                    presenters={event.presenters}
                    title={event.title}
                    upcoming
                    viewers={event.viewers}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className={`events-list-video${videoOpen ? '' : '-hidden'}`}>
        <RoomVideo handleBackArrow={handleBackArrow} />
      </div>
      <div className={`events-list-container${videoOpen ? '-hidden' : ''}`}>
        {currentEvents.map((event, i) => (
          <div className='events-list-container-item' key={i}>
            <EventCard
              chatType={event.chatType}
              content={event.content}
              eventName={event.eventName}
              eventNumber={i}
              jpeg={event.jpeg}
              label={event.label}
              presenters={event.presenters}
              title={event.title}
              viewers={event.viewers}
            />
          </div>
        ))}
        <div className='events-list-container-separator'>Coming Up</div>
        {upcomingEvents.map((event, i) => (
          <div className='events-list-container-item' key={i}>
            <EventCard
              chatType={event.chatType}
              content={event.content}
              eventName={event.eventName}
              eventNumber={i + 2}
              jpeg={event.jpeg}
              label={event.label}
              presenters={event.presenters}
              title={event.title}
              upcoming
              viewers={event.viewers}
            />
          </div>
        ))}
      </div>
    </>
  );
};
