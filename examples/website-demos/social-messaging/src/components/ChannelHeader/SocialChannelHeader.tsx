import React from 'react';

import { ArrowLeft } from '../../assets';
import { useViewContext } from '../../contexts/ViewContext';

import './SocialChannelHeader.scss';

export const SocialChannelHeader: React.FC = () => {
  const { isNewChat } = useViewContext();

  if (isNewChat) {
    return (
      <div className='social-channelheader'>
        <ArrowLeft />
        <span>New Chat</span>
      </div>
    );
  }

  return (
    <div className='social-channelheader'>
      <span>Channel Header</span>
    </div>
  );
};
