import React from 'react';

import { ChannelListMessengerProps } from 'stream-chat-react';
import { HamburgerIcon } from '../../assets/HamburgerIcon';

import './SocialChannelList.scss';

type Props = ChannelListMessengerProps & {
  isSideDrawerOpen: boolean,
  setSideDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>,
};

export const SocialChannelList: React.FC<Props> = (props) => {
  const { children, isSideDrawerOpen, setSideDrawerOpen } = props;

  const ListHeaderWrapper: React.FC<Props> = (props) => {
    const { children, isSideDrawerOpen, setSideDrawerOpen } = props;

    console.log( {props });

    return (
      <div className='messaging__channel-list'>
        <HamburgerIcon {...{ isSideDrawerOpen, setSideDrawerOpen }} />
        {children}
      </div>
    );
  };

  return (
    <ListHeaderWrapper { ...{ isSideDrawerOpen, setSideDrawerOpen}}>{children}</ListHeaderWrapper>
  );
};

