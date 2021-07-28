import React from 'react';

import { Chats } from '../../assets/Chats';
import { Mentions } from '../../assets//Mentions';
import { useViewContext } from '../../contexts/ViewContext';

import './SocialChannelList.scss';

export const SocialChannelListFooter: React.FC = () => {
    const { isListChats, isListMentions, setListChats, setListMentions } = useViewContext();

    return (
        <div className='channel-list-footer'>
            <div className='chats' onClick={() => setListChats(!isListChats)}>
                <Chats />
                <span>Chats</span>
            </div>
            <div className='mentions' onClick={() => setListMentions(!isListMentions)}>
                <Mentions />
                <span>Mentions</span>
            </div>
        </div>
    );
};