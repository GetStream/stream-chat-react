import React from 'react';

import { ThemeModal } from './ThemeModal';

import { MainEventButton, MainLogo, OverviewButton, RoomsButton } from '../../assets';
import NavigationAvatar from '../../assets/NavigationAvatar.jpg';
import { useEventContext } from '../../contexts/EventContext';

export const Navigation: React.FC = () => {
  const { setThemeModalOpen, themeModalOpen } = useEventContext();

  return (
    <div className='navigation'>
      <div className='navigation-top'>
        <MainLogo setThemeModalOpen={setThemeModalOpen} themeModalOpen={themeModalOpen} />
        {themeModalOpen && <ThemeModal />}
        <div className='navigation-top-tabs'>
          <OverviewButton />
          <MainEventButton />
          <RoomsButton />
        </div>
      </div>
      <img alt='Navigation-Avatar' src={NavigationAvatar} height='48px' width='48px' />
    </div>
  );
};
