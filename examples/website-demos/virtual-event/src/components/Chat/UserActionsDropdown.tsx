import React, { useEffect, useState } from 'react';
import { useChatContext } from 'stream-chat-react';

import { MuteUser, ReportUser } from '../../assets';
import { useEventContext, UserActions } from '../../contexts/EventContext';

import type { Channel, UserResponse } from 'stream-chat';

type Props = {
  dropdownOpen: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dmChannel?: Channel;
  participantProfile?: UserResponse;
};

export const UserActionsDropdown: React.FC<Props> = (props) => {
  const { dropdownOpen, dmChannel, participantProfile, setDropdownOpen } = props;

  const { client, mutes } = useChatContext();
  const { setActionsModalOpen, setUserActionType } = useEventContext();

  const [isUserMuted, setIsUserMuted] = useState(false);

  useEffect(() => {
    if (mutes.length) {
      const actionUserId =
        participantProfile?.id ||
        Object.keys(dmChannel?.state.members || []).filter((member) => member !== client.userID)[0];

      const actionUserIsMuted = mutes.some((mute) => mute.target.id === actionUserId);
      setIsUserMuted(actionUserIsMuted);
    }
  }, [mutes.length]); // eslint-disable-line

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (event.target instanceof HTMLElement) {
        const elements = document.getElementsByClassName('dropdown');
        const actionsModal = elements.item(0);

        if (!actionsModal?.contains(event.target)) {
          setDropdownOpen(false);
        }
      }
    };

    if (dropdownOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]); // eslint-disable-line

  const handleClick = (action: UserActions) => {
    setActionsModalOpen(true);
    setDropdownOpen(false);
    setUserActionType(action);
  };

  return (
    <div className='dropdown'>
      <div className='dropdown-option' onClick={() => handleClick(isUserMuted ? 'unmute' : 'mute')}>
        <div>{isUserMuted ? 'Unmute user' : 'Mute user'}</div>
        <MuteUser />
      </div>
      <div className='dropdown-option' onClick={() => handleClick('report')}>
        <div>Flag user</div>
        <ReportUser />
      </div>
    </div>
  );
};
