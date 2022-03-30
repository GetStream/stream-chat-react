import React, { useEffect, useState } from 'react';
import { ChannelMemberResponse } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

import { MuteUser, Trashcan, UserInfo } from '../../assets';

import { StreamChatGenerics } from '../../types';

import { UserActions, useActionsContext } from '../../contexts/ActionsContext';

type Props<SocialStreamChatGenerics extends StreamChatGenerics = StreamChatGenerics> = {
  channelId?: string;
  members: ChannelMemberResponse<SocialStreamChatGenerics>[];
  setChatInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setActionId: React.Dispatch<React.SetStateAction<string | undefined>>;
};

export const SocialPreviewActions = (props: Props<StreamChatGenerics>) => {
  const { channelId, members, setChatInfoOpen, setDropdownOpen, setActionId } = props;

  const { mutes } = useChatContext();
  const { setActionsModalOpenId, setUserActionType } = useActionsContext();

  const [isUserMuted, setIsUserMuted] = useState(false);

  const handleAction = (action: UserActions) => {
    const user = members[0].user?.id;
    if (user) setActionId(user);
    setActionsModalOpenId(channelId!);
    setDropdownOpen(false);
    setUserActionType(action);
  };

  useEffect(() => {
    if (mutes.length) {
      const actionUserId = members[0].user?.id;

      const actionUserIsMuted = mutes.some((mute) => mute.target.id === actionUserId);
      setIsUserMuted(actionUserIsMuted);
    }
  }, [mutes.length]); // eslint-disable-line

  return (
    <div className='preview-actions'>
      <div className='preview-actions-action' onClick={() => setChatInfoOpen((prev) => !prev)}>
        <UserInfo />
        View info
      </div>
      {members.length === 1 && (
        <div
          className='preview-actions-action'
          onClick={() => handleAction(isUserMuted ? 'unmute' : 'mute')}
        >
          <MuteUser />
          Mute user
        </div>
      )}
      <div className='preview-actions-action-delete'>
        <Trashcan />
        Delete conversation
      </div>
    </div>
  );
};
