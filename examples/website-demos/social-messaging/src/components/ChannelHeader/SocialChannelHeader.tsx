import React from 'react';
import { ChannelHeaderProps, useChannelStateContext } from 'stream-chat-react';

import { AvatarGroup } from '../ChannelPreview/utils';
import { ArrowLeft, BlankAvatar } from '../../assets';
import { useViewContext } from '../../contexts/ViewContext';

import './SocialChannelHeader.scss';

export const SocialChannelHeader: React.FC<ChannelHeaderProps> = (props) => {
  const { live } = props;
  const { isNewChat } = useViewContext();

  const { channel } = useChannelStateContext();

  const { members, member_count, name, watcher_count } = channel?.data || {};

  if (isNewChat) {
    return (
      <div className='social-channelheader'>
        <ArrowLeft />
        <span className='social-channelheader-new-chat'>New Chat</span>
      </div>
    );
  }

  return (
    <div className='social-channelheader'>
      {/* {members ? <AvatarGroup members={members} /> : <BlankAvatar />} */}
        <BlankAvatar size={'40'} />
      <>
        <span>{name}</span>
        {!live && !!member_count && member_count > 0 && (
          <span>{member_count} members</span>
        )}
        <span>{watcher_count} online</span> 
      </>
    </div>
  );
};