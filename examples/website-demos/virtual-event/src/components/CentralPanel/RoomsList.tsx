import React from 'react';
import { EventCard } from './EventCard';

import { useEventContext } from '../../contexts/EventContext';

import './RoomsList.scss';
import { CalendarButton } from '../../assets/CalendarButton';
import { rooms } from './rooms';

export const RoomsList = () => {
  const { chatType } = useEventContext();

  return (
    <>
      <div className={`rooms-list-video${chatType === 'room' ? '' : '-hidden'}`}>
        <h1>ROOM VIDEO</h1>
      </div>
      <div className={`rooms-list-container${chatType === 'room' ? '-hidden' : ''}`}>
        <div className='rooms-list-header'>
          <div className='rooms-list-header-title'>
            <div className='rooms-list-header-title-main'>World Hacker Summit 2021</div>
            <div className='rooms-list-header-title-sub'>Stream.IO</div>
          </div>
          <div className='rooms-list-header-calendar'>
            <CalendarButton />
          </div>
        </div>
        <div className='rooms-list-container-cards'>
          {rooms.map((room) => {
            return (
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
            );
          })}
        </div>
      </div>
    </>
  );
};
