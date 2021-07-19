import React, { useRef } from 'react';

import type { Channel } from 'stream-chat';
import { Avatar as DefaultAvatar, ChannelPreviewUIComponentProps } from 'stream-chat-react';

import './SocialChannelPreview.scss';

export const SocialChannelPreview: React.FC<ChannelPreviewUIComponentProps> = (props) => {
    const {
        active,
        Avatar = DefaultAvatar,
        channel,
        displayImage,
        displayTitle,
        latestMessage,
        setActiveChannel,
        unread,
        watchers,
      } = props;
    
      const channelPreviewButton = useRef<HTMLButtonElement | null>(null);
    
      const activeClass = active ? 'active' : '';
      // const unreadClass = unread && unread >= 1 ? 'unread' : '';
    
      const onSelectChannel = () => {
        if (setActiveChannel) {
          setActiveChannel(channel, watchers);
        }
        if (channelPreviewButton?.current) {
          channelPreviewButton.current.blur();
        }
      };

      const getTimeStamp = (channel: Channel) => {
        let lastHours = channel.state.last_message_at?.getHours();
        let lastMinutes: string | number | undefined = channel.state.last_message_at?.getMinutes();
        let half = 'AM';
      
        if (lastHours === undefined || lastMinutes === undefined) {
          return '';
        }
      
        if (lastHours > 12) {
          lastHours = lastHours - 12;
          half = 'PM';
        }
      
        if (lastHours === 0) lastHours = 12;
        if (lastHours === 12) half = 'PM';
      
        if (lastMinutes.toString().length === 1) {
          lastMinutes = `0${lastMinutes}`;
        }
      
        return `${lastHours}:${lastMinutes} ${half}`;
      };
    
      return (
        <button
          className={`channel-preview ${activeClass}`}
          onClick={onSelectChannel}
          ref={channelPreviewButton}
        >
          <div>
            <Avatar image={displayImage} name={displayTitle} size={40} />
          </div>
          <div className='channel-preview-contents'>
            <div className='channel-preview-contents-name'>
              <span>{displayTitle}</span>
            </div>
            <div className='channel-preview-contents-last-message'>{latestMessage}</div>
          </div>
          <div className='channel-preview-end'>
            {unread && <span className='channel-preview-end-unread'>{unread}</span>}
            <p className='channel-preview-end-timestamp'>{getTimeStamp(channel)}</p>
          </div>
        </button>
      )
};