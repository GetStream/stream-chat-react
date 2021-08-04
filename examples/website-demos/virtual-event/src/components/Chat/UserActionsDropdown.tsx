import React, { useEffect, useState } from 'react';
import { Channel as StreamChannel } from 'stream-chat';

import './DMChannel.scss';

import { BlockUser, MuteUser, ReportUser } from '../../assets';

type Props = {
  actionsOpen: boolean;
  setActionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dmChannel?: StreamChannel;
};

export const UserActionsDropdown: React.FC<Props> = (props) => {
  const { actionsOpen, dmChannel, setActionsOpen } = props;

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
          setActionsOpen(false);
        }
      }
    };

    if (actionsOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionsOpen]); // eslint-disable-line

  const handleMute = async () => {
    if (dmChannel) {
      isChannelMuted ? await dmChannel.unmute() : await dmChannel.mute();
      setActionsOpen(false);
    }
  };

  return (
    <div className='dropdown'>
      <div className='dropdown-option' onClick={() => handleMute()}>
        <div>{isChannelMuted ? 'Unmute user' : 'Mute user'}</div>
        <MuteUser />
      </div>
      <div className='dropdown-option' onClick={() => setActionsOpen(false)}>
        <div>Block user</div>
        <BlockUser />
      </div>
      <div className='dropdown-option' onClick={() => setActionsOpen(false)}>
        <div>Report user</div>
        <ReportUser />
      </div>
    </div>
  );
};
