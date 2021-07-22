import React from 'react';

import { Chats } from '../../assets/Chats';
import { Mentions } from '../../assets//Mentions';

import './SocialChannelList.scss';

// type Props = {};

export const SocialChannelListFooter: React.FC = () => {
    return (
        <div className='channel-list-footer'>
            <div className='chats'>
                <Chats />
                <span>Chats</span>
            </div>
            <div className='mentions'>
                <Mentions />
                <span>Mentions</span>
            </div>
        </div>
    );
};