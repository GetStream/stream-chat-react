import React from 'react';

import { LoadingIndicator } from 'stream-chat-react';

import { HamburgerIcon, NewChat } from '../../assets';

import './SocialChannelList.scss';

type Props = {
  error?: boolean;
};

export const SocialChannelListHeader: React.FC<Props> = (props) => {
  const { error } = props;

  return (
    <div className='channel-list-header'>
      <HamburgerIcon />
      <>
        {error && <LoadingIndicator />}
        <span className='channel-list-header-text'>
          {!error ? 'Stream Chat' : 'Waiting for Network'}
        </span>
      </>
      <NewChat />
    </div>
  );
};
