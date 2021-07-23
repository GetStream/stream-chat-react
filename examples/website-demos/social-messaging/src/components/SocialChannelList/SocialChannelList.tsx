import React, { useState } from 'react';

import { ChannelListMessengerProps } from 'stream-chat-react';

import { SocialChannelListFooter } from '../../components/SocialChannelList/SocialChannelListFooter';

import './SocialChannelList.scss';

type Props = ChannelListMessengerProps;

export const SocialChannelList: React.FC<Props> = (props) => {
  const { children } = props;

  const [isListMentions, setListMentions] = useState(false);
  const [isListChats, setListChats] = useState(false);

  const ListHeaderWrapper: React.FC<Props> = (props) => {
    const { children } = props;

    return (
      <>
        <div className='channel-list'>
          {children}
        </div>
        <SocialChannelListFooter { ...{ isListChats, isListMentions, setListChats, setListMentions}} />
      </>
    );
  };

  return (
    <ListHeaderWrapper>{children}</ListHeaderWrapper>
  );
};

