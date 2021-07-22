import React, { useRef } from 'react';

import { ChannelPreviewUIComponentProps, useChatContext } from 'stream-chat-react';

import { AvatarGroup, getTimeStamp } from './utils';

import './SocialChannelPreview.scss';

export const SocialChannelPreview: React.FC<ChannelPreviewUIComponentProps> = (props) => {
    const {
      active,
      channel,
      displayTitle,
      latestMessage,
      setActiveChannel,
      unread,
    } = props;

    const { client } = useChatContext();

    console.log('channel IS:', channel);
    // checkmark - delivered;
    // double checkmark - read;
  
    const channelPreviewButton = useRef<HTMLButtonElement | null>(null);
  
    const activeClass = active ? 'active' : '';
    const unreadCount = unread && unread > 0 ? true : false;

    const members = Object.values(channel.state.members).filter(
      ({ user }) => user?.id !== client.userID,
    );
  
    return (
      <button
        className={`channel-preview ${activeClass}`}
        onClick={() => {
          setActiveChannel?.(channel);
        }}
        ref={channelPreviewButton}
      >
        <div className='channel-preview-avatar'>
          <AvatarGroup members={members} />
        </div>
        <div className='channel-preview-contents'>
          <div className='channel-preview-contents-name'>
            <span>{displayTitle}</span>
          </div>
          <div className='channel-preview-contents-last-message'>{latestMessage}</div>
        </div>
        <div className='channel-preview-end'>
          <div className={`channel-preview-end-unread ${unreadCount ? '' : 'unreadCount'}`}>
            <span className='channel-preview-end-unread-text'>{unread}</span>
          </div>
          <p className='channel-preview-end-timestamp'>{getTimeStamp(channel)}</p>
        </div>
      </button>
    )
};