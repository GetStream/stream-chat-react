import React from 'react';

import './Navigation.scss';

import { MainEventButton, MainLogo, OverviewButton, RoomsButton } from '../../assets';
import NavigationAvatar from '../../assets/NavigationAvatar.png';

export const Navigation: React.FC = () => {
  return (
    <div className='navigation'>
      <div className='top'>
        <MainLogo />
        <div className='tab-options'>
          <OverviewButton />
          <MainEventButton />
          <RoomsButton />
        </div>
      </div>
      <img alt='Navigation-Avatar' src={NavigationAvatar} height='48px' width='48px' />
    </div>
  );
};
