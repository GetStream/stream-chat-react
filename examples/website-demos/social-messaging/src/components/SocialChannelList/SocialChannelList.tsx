import React, { useState } from 'react';

import type { Channel } from 'stream-chat';
import { Avatar, ChannelListMessengerProps, useChatContext } from 'stream-chat-react';

import { SocialChannelListFooter } from '../../components/SocialChannelList/SocialChannelListFooter';
import { SocialChannelPreview } from '../../components/ChannelPreview/SocialChannelPreview';


import './SocialChannelList.scss';

type Props = ChannelListMessengerProps;

export const SocialChannelList: React.FC<Props> = (props) => {
  const { children, loadedChannels } = props;

  const { channel, setActiveChannel } = useChatContext();

  const ListHeaderWrapper: React.FC<Props> = (props) => {
    const { children, loadedChannels } = props;

    const renderChannel = (item: Channel) => {
      if (!item) return null;
  
      const previewProps = {
        activeChannel: channel,
        Avatar,
        channel: item,
        // channelUpdateCount, // forces the update of preview component on channel update
        key: item.id,
        SocialChannelPreview,
        setActiveChannel,
      };
  
      return <SocialChannelPreview {...previewProps} />;
    };

    let thing = loadedChannels?.map(renderChannel).slice(loadedChannels.length-1);
    console.log('thing IS:', thing);

    return (
      <>
        <div className='channel-list'>
          {children}
        </div>
        <SocialChannelListFooter />
      </>
    );
  };

  return (
    <ListHeaderWrapper loadedChannels={loadedChannels}>{children}</ListHeaderWrapper>
  );
};

