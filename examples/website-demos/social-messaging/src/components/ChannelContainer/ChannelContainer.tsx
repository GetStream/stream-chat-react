import React from 'react';

import { SocialChannelHeader } from '../ChannelHeader/SocialChannelHeader';
import { SocialMessageList } from '../MessageList/SocialMessageList';

import './ChannelContainer.scss';

type Props = {};

export const ChannelContainer: React.FC<Props> = (props) => {
  return (
    <div className='channel-container'>
        <SocialChannelHeader />
        <SocialMessageList />
      <p>Channel Container</p>
    </div>
  );
};