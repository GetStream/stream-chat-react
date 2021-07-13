import React from 'react';

import { ChannelListMessengerProps } from 'stream-chat-react';

import './SocialChannelList.scss';

type Props = ChannelListMessengerProps;

export const SocialChannelList: React.FC<Props> = (props) => {
  const { children } = props;

  const ListHeaderWrapper: React.FC = ({ children }) => {
    return (
      <div className='messaging__channel-list'>
        <span>Channel List Header with hamburger icon</span>
        {children}
      </div>
    );
  };

  return (
    <ListHeaderWrapper>{children}</ListHeaderWrapper>
  );
};

