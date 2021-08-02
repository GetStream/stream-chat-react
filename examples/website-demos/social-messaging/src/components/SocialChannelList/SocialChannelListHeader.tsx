import React from 'react';

import { HamburgerIcon } from '../../assets/HamburgerIcon';
import { NewChat } from '../../assets/NewChat';

import './SocialChannelList.scss';

export const SocialChannelListHeader: React.FC = () => {
  return (
    <div className='channel-list-header'>
      <HamburgerIcon />
      <span className='channel-list-header-text'>Stream Chat</span>
      <NewChat />
    </div>
  );
};
