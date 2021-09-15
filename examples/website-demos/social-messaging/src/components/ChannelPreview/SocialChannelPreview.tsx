import React, { useRef } from 'react';

import { ChannelPreviewUIComponentProps, useChatContext } from 'stream-chat-react';

import { AvatarGroup, getTimeStamp } from './utils';

import './SocialChannelPreview.scss';

import {
  SocialAttachmentType,
  SocialChannelType,
  SocialCommandType,
  SocialEventType,
  SocialMessageType,
  SocialReactionType,
  SocialUserType,
} from '../ChatContainer/ChatContainer';

import { useViewContext } from '../../contexts/ViewContext';
// import { DoubleCheckmark } from '../../assets/DoubleCheckmark';

export const SocialChannelPreview: React.FC<ChannelPreviewUIComponentProps> = (props) => {
  const { active, channel, displayTitle, latestMessage, setActiveChannel, unread } = props;

  const { client } = useChatContext<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >();

  const {
    chatsUnreadCount,
    isListMentions,
    mentionsUnreadCount,
    setChatsUnreadCount,
    setMentionsUnreadCount,
  } = useViewContext();

  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);

  const activeClass = active ? 'active' : '';
  const online = channel.state.watcher_count > 0 ? true : false;
  const unreadCount = unread && unread > 0 ? true : false;

  const members = Object.values(channel.state.members).filter(
    ({ user }) => user?.id !== client.userID,
  );

  const handleUnreadCounts = () => {
    if (unread) setChatsUnreadCount(chatsUnreadCount - unread);
    if (unread && isListMentions) setMentionsUnreadCount(mentionsUnreadCount - unread);
  };

  return (
    <button
      className={`channel-preview ${activeClass}`}
      onClick={() => {
        handleUnreadCounts();
        setActiveChannel?.(channel);
      }}
      ref={channelPreviewButton}
    >
      <div className='channel-preview-avatar'>
        {online && <div className='channel-preview-avatar-online'></div>}
        <AvatarGroup members={members} size={56} />
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
        <div className='channel-preview-end-statuses'>
          {/* <div className='channel-preview-end-statuses-arrows'>
              {members.length === 2 && <DoubleCheckmark />}
            </div> */}
          <p className='channel-preview-end-statuses-timestamp'>{getTimeStamp(channel)}</p>
        </div>
      </div>
    </button>
  );
};
