import React from 'react';

import { HamburgerIcon } from '../../assets/HamburgerIcon';
import { NewChat } from '../../assets/NewChat';

import './SocialChannelList.scss';

type Props = {
    isNewChat: boolean;
    isSideDrawerOpen: boolean,
    setNewChat: React.Dispatch<React.SetStateAction<boolean>>,
    setSideDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>,
};

export const SocialChannelListHeader: React.FC<Props> = (props) => {
    const { isNewChat, isSideDrawerOpen, setNewChat, setSideDrawerOpen } = props;

    return (
        <div className='channel-list-header'>
            <HamburgerIcon {...{ isSideDrawerOpen, setSideDrawerOpen }} />
            <span className='text'>Stream Chat</span>
            <NewChat {...{ isNewChat, setNewChat }} />
        </div>
    );
};