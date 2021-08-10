import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react';

import { rooms } from './data';
import { EventCard } from './EventCard';
import { RoomVideo } from './RoomVideo';

import { CalendarButton } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

export const RoomsList = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { chatType, setChatType, setEventName } = useEventContext();

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
  };

  const calendarClick = (event: BaseSyntheticEvent) => {
    event.stopPropagation();
    setDropdownOpen((prev) => !prev);
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
        {dropdownOpen && (
          <div className='rooms-list-dropdown' ref={dropdownRef}>
            {rooms.map((room, i) => (
              <div className='rooms-list-card' key={i}>
                <EventCard
                  chatType={room.chatType}
                  content={room.content}
                  eventName={room.eventName}
                  label={room.label}
                  presenters={room.presenters}
                  title={room.title}
                  viewers={room.viewers}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={`rooms-list-video${chatType === 'room' ? '' : '-hidden'}`}>
        <RoomVideo handleBackArrow={handleBackArrow} />
      </div>
      <div className={`rooms-list-container${chatType === 'room' ? '-hidden' : ''}`}>
        <div className='rooms-list-container-cards'>
          {rooms.map((room, i) => (
            <div className='rooms-list-card' key={i}>
              <EventCard
                chatType={room.chatType}
                content={room.content}
                eventName={room.eventName}
                Image={room.Image}
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
