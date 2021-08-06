import React, { useEffect, useRef, useState } from 'react';

import { EventCard } from './EventCard';
import { rooms } from './rooms';

import { CalendarButton } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

export const RoomsList = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { chatType } = useEventContext();

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

    document.addEventListener('mousedown', checkIfClickedOutside);
    return () => {
      document.removeEventListener('mousedown', checkIfClickedOutside);
    };
  }, [dropdownOpen]);

  const calendarClick = () => setDropdownOpen(!dropdownOpen);

  return (
    <>
      <div className={`rooms-list-video${chatType === 'room' ? '' : '-hidden'}`}>
        <h1>ROOM VIDEO</h1>
      </div>
      <div className={`rooms-list-container${chatType === 'room' ? '-hidden' : ''}`}>
        <div className='rooms-list-header'>
          <div className='rooms-list-header-title'>
            <div className='rooms-list-header-title-main'>World Hacker Summit 2021</div>
            <div className='rooms-list-header-title-sub'>Stream</div>
          </div>
          <div className='rooms-list-header-calendar' onClick={calendarClick}>
            <CalendarButton />
          </div>
          {dropdownOpen && (
            <div className='rooms-list-dropdown' ref={dropdownRef}>
              {rooms.map((room) => (
                <div className='rooms-list-card'>
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
        <div className='rooms-list-container-cards'>
          {rooms.map((room) => (
            <div className='rooms-list-card'>
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
