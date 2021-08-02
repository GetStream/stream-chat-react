import React from 'react';
import { EventCard } from './EventCard';

import { Card1, Card2 } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

import './RoomsList.scss';
import { CalendarButton } from '../../assets/CalendarButton';

export const RoomsList = () => {
  const { chatType } = useEventContext();

  console.log({ chatType });

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
          <div className='rooms-list-card'>
            <EventCard
              chatType='room'
              content='How to set a business plans to use information to a competitive advantage and support enterprise goals.'
              eventName='esg'
              Image={Card1}
              label='Private'
              presenters={6}
              title='ESG Data - How to create it'
              viewers={150}
            />
          </div>
          <div className='rooms-list-card'>
            <EventCard
              chatType='room'
              content='How to set a business plans to use information to a competitive advantage and support enterprise goals.'
              eventName='qa'
              Image={Card1}
              label='Moderated'
              presenters={6}
              title='Q&A session: Data strategy and executive communication'
              viewers={150}
            />
          </div>
          <div className='rooms-list-card'>
            <EventCard
              chatType='room'
              content='How to set a business plans to use information to a competitive advantage and support enterprise goals.'
              eventName='qa'
              Image={Card1}
              label='Moderated'
              presenters={6}
              title='Q&A session: Data strategy and executive communication'
              viewers={150}
            />
          </div>
          <div className='rooms-list-card'>
            <EventCard
              chatType='room'
              content='How to set a business plans to use information to a competitive advantage and support enterprise goals.'
              eventName='entertainment'
              Image={Card2}
              label='Open'
              presenters={6}
              title='Entertainment data literacy: learning to love the data'
              viewers={150}
            />
          </div>
          <div className='rooms-list-card'>
            <EventCard
              chatType='room'
              content='How to set a business plans to use information to a competitive advantage and support enterprise goals.'
              eventName='tools'
              Image={Card1}
              label='Closed'
              presenters={6}
              title='Tools, Teams and Processes: how to successfully implement a data…'
              viewers={150}
            />
          </div>
          <div className='rooms-list-card'>
            <EventCard
              chatType='room'
              content='How to set a business plans to use information to a competitive advantage and support enterprise goals.'
              eventName='roi'
              Image={Card1}
              label='Open'
              presenters={6}
              title='Defining ROI in the Modern Data World'
              viewers={150}
            />
          </div>
        </div>
      </div>
    </>
  );
};
