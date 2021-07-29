import React from 'react';

import { ChannelListMessengerProps } from 'stream-chat-react';

import { SocialChannelListFooter } from '../../components/SocialChannelList/SocialChannelListFooter';

import './SocialChannelList.scss';

type Props = ChannelListMessengerProps;

export const SocialChannelList: React.FC<Props> = (props) => {
  const { children, loadedChannels } = props;

  const ListHeaderWrapper: React.FC<Props> = (props) => {
    const { children, loadedChannels } = props;
    
    return (
      <>
        <div className='channel-list'>
          {children}
        </div>
        <SocialChannelListFooter loadedChannels={loadedChannels} />
      </>
    );
  };

  return (
    <ListHeaderWrapper loadedChannels={loadedChannels}>{children}</ListHeaderWrapper>
  );
};

