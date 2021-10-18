import React from 'react';
import {
  ChannelHeaderProps,
  Tooltip,
  useChannelStateContext,
  useChatContext,
} from 'stream-chat-react';

import { AvatarGroup } from '../ChannelPreview/utils';
import { ArrowLeft } from '../../assets';
import { useViewContext } from '../../contexts/ViewContext';

import './SocialChannelHeader.scss';

export const SocialChannelHeader: React.FC<ChannelHeaderProps> = (props) => {
  const { live } = props;
  const { client } = useChatContext();
  const { isNewChat } = useViewContext();

  const { channel } = useChannelStateContext();

  const members = Object.values(channel.state.members).filter(
    ({ user }) => user?.id !== client.userID,
  );

  const { member_count, name, watcher_count } = channel?.data || {};

  const channelName = members.length === 1 ? members[0].user?.name || members[0].user?.id : name;

  if (isNewChat) {
    return (
      <div className='social-channel-header'>
        <ArrowLeft />
        <span className='social-channel-header-new-chat'>New Chat</span>
      </div>
    );
  }

  return (
    <div className='social-channel-header'>
      <div className='social-channel-header-avatar'>
        <AvatarGroup members={members} size={40} />
      </div>
      <div className='social-channel-header-contents'>
        <span className='social-channel-header-contents-name'>{channelName || 'Channel Name'}</span>
        {!live && !!member_count && member_count > 0 && (
          <span className='social-channel-header-contents-status'>
            {member_count || '0'} Members, {watcher_count || '0'} Online
          </span>
        )}
      </div>
    </div>
  );
};
