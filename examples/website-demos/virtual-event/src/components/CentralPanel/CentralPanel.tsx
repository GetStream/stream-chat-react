import React from 'react';

import { OverviewContainer } from './OverviewContainer';
import { VideoContainer } from './VideoContainer';

import { useEventContext } from '../../contexts/EventContext';

import './CentralPanel.scss';
import { RoomsList } from './RoomsList';

export const CentralPanel = () => {
  const { selected } = useEventContext();

  switch (selected) {
    case 'main-event':
      return (
        <div className='central-panel-container'>
          <VideoContainer />
        </div>
      );
    case 'rooms':
      return (
        <div className='central-panel-container'>
          <RoomsList />
        </div>
      );
    case 'overview':
    default:
      return (
        <div className='central-panel-container'>
          <OverviewContainer />
        </div>
      );
  }
};
