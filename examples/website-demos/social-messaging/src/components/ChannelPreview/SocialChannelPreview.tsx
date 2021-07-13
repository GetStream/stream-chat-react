import React, { useRef } from 'react';

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
    
      const activeClass = active ? 'str-chat__channel-preview-messenger--active' : '';
      const unreadClass = unread && unread >= 1 ? 'str-chat__channel-preview-messenger--unread' : '';
    
      const onSelectChannel = () => {
        if (setActiveChannel) {
          setActiveChannel(channel, watchers);
        }
        if (channelPreviewButton?.current) {
          channelPreviewButton.current.blur();
        }
      };
    
      return (
        <button
          className={`str-chat__channel-preview-messenger ${unreadClass} ${activeClass}`}
          data-testid='channel-preview-button'
          onClick={onSelectChannel}
          ref={channelPreviewButton}
        >
          <div className='str-chat__channel-preview-messenger--left'>
            <Avatar image={displayImage} name={displayTitle} size={40} />
          </div>
          <div className='str-chat__channel-preview-messenger--right'>
            <div className='str-chat__channel-preview-messenger--name'>
              <span>{displayTitle}</span>
            </div>
            <div className='str-chat__channel-preview-messenger--last-message'>{latestMessage}</div>
          </div>
        </button>
      )
};