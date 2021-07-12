import React from 'react';

import './Navigation.scss';

import { MainEventButton, MainLogo, OverviewButton, RoomsButton } from '../../assets';
import NavigationAvatar from '../../assets/NavigationAvatar.png';

import type { TabProps } from '../../App';

type Props = TabProps & {
  setEvent: React.Dispatch<React.SetStateAction<string>>;
};

export const Navigation: React.FC<Props> = (props) => {
  const { selected, setSelected } = props;

  return (
    <div className='navigation'>
      <div className='top'>
        <MainLogo />
        <div className='tab-options'>
          <OverviewButton selected={selected} setSelected={setSelected} />
          <MainEventButton selected={selected} setSelected={setSelected} />
          <RoomsButton selected={selected} setSelected={setSelected} />
        </div>
      </div>
      <img alt='Navigation-Avatar' src={NavigationAvatar} height='48px' width='48px' />
    </div>
  );
};
