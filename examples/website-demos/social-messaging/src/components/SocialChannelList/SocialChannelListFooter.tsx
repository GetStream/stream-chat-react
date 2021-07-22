import React from 'react';

import { Chats } from '../../assets/Chats';
import { Mentions } from '../../assets//Mentions';

import './SocialChannelList.scss';

type Props = {
    isListChats: boolean,
    isListMentions: boolean,
    setListChats: React.Dispatch<React.SetStateAction<boolean>>,
    setListMentions: React.Dispatch<React.SetStateAction<boolean>>,
};

export const SocialChannelListFooter: React.FC<Props> = (props) => {
    const { isListChats, isListMentions, setListChats, setListMentions } = props;

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