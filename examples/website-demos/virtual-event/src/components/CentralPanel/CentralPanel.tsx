import { EventsList } from './EventsList';
import { OverviewContainer } from './OverviewContainer';
import { RoomsList } from './RoomsList';

import { useEventContext } from '../../contexts/EventContext';

export const CentralPanel = () => {
  const { selected } = useEventContext();

  switch (selected) {
    case 'main-event':
      return (
        <div className='central-panel-container'>
          <EventsList />
        </div>
      );

    case 'rooms':
      return (
        <div className='central-panel-container'>
          <RoomsList />
        </div>
      );

    case 'overview':
      return (
        <div className='central-panel-container'>
          <OverviewContainer />
        </div>
      );
  }
};
