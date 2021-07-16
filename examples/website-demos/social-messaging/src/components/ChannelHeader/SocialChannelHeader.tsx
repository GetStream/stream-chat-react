import React from 'react';

import { ArrowLeft } from '../../assets/ArrowLeft';

import './SocialChannelHeader.scss';

type Props = {
  isNewChat: boolean;
  setNewChat: React.Dispatch<React.SetStateAction<boolean>>,
};

export const SocialChannelHeader: React.FC<Props> = (props) => {
  const { isNewChat, setNewChat } = props;

  if (isNewChat) {
    return (
      <div className='social-channelheader'>
        <ArrowLeft {...{isNewChat, setNewChat }} />
        <span>New Chat</span>
      </div>
    )
  }

  return (
    <div className='social-channelheader'>
      <span>Channel Header</span>
    </div>
  );
};