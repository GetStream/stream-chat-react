import React, { useRef, useState } from 'react';

import { ChannelPreviewUIComponentProps, useChatContext } from 'stream-chat-react';

import { ActionsModal } from '../MessageActions/ActionsModal';

import { AvatarGroup, getTimeStamp } from './utils';

import './SocialChannelPreview.scss';

import { useActionsContext } from '../../contexts/ActionsContext';
import { useUnreadContext } from '../../contexts/UnreadContext';
import { useViewContext } from '../../contexts/ViewContext';
import { ActionsEllipse } from '../../assets';
// import { DoubleCheckmark } from '../../assets/DoubleCheckmark';

import { SocialPreviewActions } from './SocialPreviewActions';

export const SocialChannelPreview: React.FC<ChannelPreviewUIComponentProps> = (props) => {
  const { active, channel, displayTitle, latestMessage, setActiveChannel, unread } = props;

  const { client } = useChatContext();

  const { actionsModalOpenId, userActionType } = useActionsContext();

  const {
    chatsUnreadCount,
    mentionsUnreadCount,
    setChatsUnreadCount,
    setMentionsUnreadCount,
  } = useUnreadContext();

  const { isListMentions, setChatInfoOpen, setNewChat } = useViewContext();

  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);

  const [actionId, setActionId] = useState<string>();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showInfoOptions, setShowInfoOptions] = useState(false);

  const activeClass = active ? 'active' : '';
  const online = channel.state.watcher_count > 1 ? true : false;
  const unreadCount = unread && unread > 0 ? true : false;

  const members = Object.values(channel.state.members).filter(
    ({ user }) => user?.id !== client.userID,
  );

  const handleUnreadCounts = () => {
    if (unread) setChatsUnreadCount(chatsUnreadCount - unread);
    if (unread && isListMentions) setMentionsUnreadCount(mentionsUnreadCount - unread);
  };

  const createChannelName = () => {
    const memberNames = members
      .map(({ user }) => user?.name || user?.id)
      .slice(0, 2)
      .join(', ');
    return `${memberNames}${members.length > 2 ? '...' : ''}`;
  };

  return (
    <>
      {actionsModalOpenId === channel.id && userActionType && (
        <ActionsModal actionId={actionId} userActionType={userActionType} />
      )}
      <button
        className={`channel-preview ${activeClass} ${online ? '' : 'offline'}`}
        onClick={() => {
          setNewChat(false);
          handleUnreadCounts();
          setActiveChannel?.(channel);
        }}
        onMouseEnter={() => setShowInfoOptions(true)}
        onMouseLeave={() => setShowInfoOptions(false)}
        ref={channelPreviewButton}
      >
        <div className='channel-preview-avatar'>
          {online && <div className='channel-preview-avatar-online'></div>}
          <AvatarGroup members={members} size={56} />
        </div>
        <div className='channel-preview-contents'>
          <div className='channel-preview-contents-name'>
            <span>{displayTitle || createChannelName()}</span>
          </div>
          <div className='channel-preview-contents-last-message'>{latestMessage}</div>
        </div>
        <div className='channel-preview-end'>
          <>
            {showInfoOptions && (
              <span
                className='channel-preview-end-options'
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <ActionsEllipse />
              </span>
            )}
            {!showInfoOptions && (
              <div className={`channel-preview-end-unread ${unreadCount ? '' : 'unreadCount'}`}>
                <span className='channel-preview-end-unread-text'>{unread}</span>
              </div>
            )}
          </>
          <div className='channel-preview-end-statuses'>
            {/* <div className='channel-preview-end-statuses-arrows'>
              {members.length === 2 && <DoubleCheckmark />}
            </div> */}
            <p className='channel-preview-end-statuses-timestamp'>{getTimeStamp(channel)}</p>
          </div>
        </div>
      </button>
      {dropdownOpen && (
        <SocialPreviewActions
          channelId={channel.id}
          members={members}
          setChatInfoOpen={setChatInfoOpen}
          setActionId={setActionId}
          setDropdownOpen={setDropdownOpen}
        />
      )}
    </>
  );
};
