import React, { useState } from 'react';

import type { Channel } from 'stream-chat';
import { Avatar, ChannelListMessengerProps, getLatestMessagePreview, useChatContext } from 'stream-chat-react';

import { SocialChannelListFooter } from '../../components/SocialChannelList/SocialChannelListFooter';
import { SocialChannelPreview } from '../../components/ChannelPreview/SocialChannelPreview';

import { useViewContext } from '../../contexts/ViewContext';

import './SocialChannelList.scss';

type Props = ChannelListMessengerProps;

export const SocialChannelList: React.FC<Props> = (props) => {
  const { children, loadedChannels } = props;

  const { channel, setActiveChannel } = useChatContext();

  const ListHeaderWrapper: React.FC<Props> = (props) => {
    const { children, loadedChannels } = props;
    
    const { isListMentions } = useViewContext();

    const renderChannel = (item: Channel) => {
      if (!item) return null;
  
      const previewComponentProps = {
        activeChannel: channel,
        Avatar,
        channel: item,
        // channelUpdateCount, // forces the update of preview component on channel update
        key: item.id,
        SocialChannelPreview,
        setActiveChannel,
      };
  
      return <SocialChannelPreview {...previewComponentProps} />;
    };

    // /** If the component's channel is the active (selected) Channel */
    // active?: boolean;
    // /** Image of Channel to display */
    // displayImage?: string;
    // /** Title of Channel to display */
    // displayTitle?: string;
    // /** The last message received in a channel */
    // lastMessage?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
    // /** Latest message preview to display, will be a string or JSX element supporting markdown. */
    // latestMessage?: string | JSX.Element;
    // /** Number of unread Messages */
    // unread?: number;

    console.log('loadedChannels IS:', loadedChannels);

    let thing = loadedChannels?.map(renderChannel).slice(loadedChannels.length-1);
    console.log('thing IS:', thing);

    return (
      <>
        <div className='channel-list'>
          { isListMentions ? thing : children }
        </div>
        <SocialChannelListFooter />
      </>
    );
  };

  return (
    <ListHeaderWrapper loadedChannels={loadedChannels}>{children}</ListHeaderWrapper>
  );
};

