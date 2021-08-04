import React, { useEffect, useState } from 'react';
import { Channel as StreamChannel } from 'stream-chat';

import './DMChannel.scss';

import { BlockUser, MuteUser, ReportUser } from '../../assets';
import { useEventContext, UserActions } from '../../contexts/EventContext';

type Props = {
  dropdownOpen: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dmChannel?: StreamChannel;
};

export const UserActionsDropdown: React.FC<Props> = (props) => {
  const { dropdownOpen, dmChannel, setDropdownOpen } = props;

  const { setActionsModalOpen, setUserActionType } = useEventContext();

  const [isChannelMuted, setIsChannelMuted] = useState(false);

  useEffect(() => {
    if (dmChannel) {
      const muted = dmChannel.muteStatus().muted;
      setIsChannelMuted(muted);
    }
  }, [dmChannel]);

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
      <div className='dropdown-option' onClick={() => handleClick('mute')}>
        <div>{isChannelMuted ? 'Unmute user' : 'Mute user'}</div>
        <MuteUser />
      </div>
      <div className='dropdown-option' onClick={() => handleClick('block')}>
        <div>Block user</div>
        <BlockUser />
      </div>
      <div className='dropdown-option' onClick={() => handleClick('report')}>
        <div>Report user</div>
        <ReportUser />
      </div>
    </div>
  );
};
