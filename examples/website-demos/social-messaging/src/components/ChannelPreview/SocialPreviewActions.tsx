import React, { useEffect, useState } from 'react';
import { ChannelMemberResponse } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

import { DeleteMessage, MuteUser, UserInfo } from '../../assets';

import { SocialUserType } from '../ChatContainer/ChatContainer';

import { UserActions, useViewContext } from '../../contexts/ViewContext';

// import {
//   CopyMessage,
//   DeleteMessage,
//   EditMessage,
//   FlagMessage,
//   MuteUser,
//   PinMessage,
//   QuoteReply,
//   StartThread,
// } from '../../assets';
// import { useViewContext, UserActions } from '../../contexts/ViewContext';

// import type { UserResponse } from 'stream-chat';

type Props<SocialUserType> = {
  channelId: string;
  members: ChannelMemberResponse<SocialUserType>[];
  setChatInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  //   dropdownOpen: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  //   openThread?: ReactEventHandler;
  setActionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  //   thread?: boolean;
  //   user?: UserResponse | null;
  //   setEdit: ReactEventHandler;
};

export const SocialPreviewActions = (props: Props<SocialUserType>) => {
  const { channelId, members, setChatInfoOpen, setDropdownOpen, setActionId } = props;

  const { mutes } = useChatContext();
  const { setActionsModalOpenId, setUserActionType } = useViewContext();

  const [isUserMuted, setIsUserMuted] = useState(false);

  const handleAction = (action: UserActions) => {
    console.log('members[0].user?.id IS:', members[0].user?.id);
    //   setMessageActionUser?.(user.id);
    const user = members[0].user?.id;
    setActionId(user);
    setActionsModalOpenId(channelId);
    setDropdownOpen(false);
    setUserActionType(action);
  };

  useEffect(() => {
    if (mutes.length) {
      console.log('in the mutes length');
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
        <DeleteMessage />
        Delete conversation
      </div>
    </div>
  );
};
