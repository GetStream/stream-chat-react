import React from 'react';

import { OverviewContainer } from './OverviewContainer';
import { VideoContainer } from './VideoContainer';

import { useEventContext } from '../../contexts/EventContext';

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
          <h1>Rooms</h1>
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
