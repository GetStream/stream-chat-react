import React from 'react';

import { Channel } from 'stream-chat';

import { Chats } from '../../assets/Chats';
import { Mentions } from '../../assets//Mentions';
import { useViewContext } from '../../contexts/ViewContext';

import './SocialChannelList.scss';

type Props = {
    loadedChannels?: Channel[];
}

export const SocialChannelListFooter: React.FC<Props> = (props) => {
    const { loadedChannels } = props;

    const { setListMentions } = useViewContext();

    const getTotalChatUnreadCount =
        loadedChannels?.map(channel => channel.countUnread()).reduce((total, count) => total + count, 0);

    const getTotalMentionsUnreadCount =
        loadedChannels?.map(channel => channel.countUnreadMentions()).reduce((total, count) => total + count, 0);

    return (
        <div className='channel-list-footer'>
            <div className='chats' onClick={() => setListMentions(false)}>
                <div className={`chats-unread ${getTotalChatUnreadCount ? '' : 'unreadCount'}`}>
                    <span className='chats-unread-text'>{getTotalChatUnreadCount}</span>
                </div>
                <div className='chats-text'>
                    <Chats />
                    <span>Chats</span>
                </div>
            </div>
            <div className='mentions' onClick={() => setListMentions(true)}>
                <div className={`mentions-unread ${getTotalMentionsUnreadCount ? '' : 'unreadCount'}`}>
                    <span className='mentions-unread-text'>{getTotalMentionsUnreadCount}</span>
                </div>
                <div className='mentions-text'>
                    <Mentions />
                    <span>Mentions</span>
                </div>
            </div>
        </div>
    );
};