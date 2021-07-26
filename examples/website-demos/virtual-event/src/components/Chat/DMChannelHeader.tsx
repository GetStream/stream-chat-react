import React, { useState } from 'react';
import { Channel } from 'stream-chat';

import { CloseX } from '../../assets/CloseX';
import { Ellipse } from '../../assets/Ellipse';
import { useEventContext } from '../../contexts/EventContext';

import './DMChannelHeader.scss';

const DropDown = ({
  dmChannel,
  setOpenMenu,
}: {
  dmChannel: Channel | undefined;
  setOpenMenu: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleMute = async () => {
    const muted = dmChannel?.muteStatus().muted;

    muted ? await dmChannel?.unmute() : await dmChannel?.mute();
    setOpenMenu(false);
  };

  return (
    <div className='dropdown'>
      <div className='dropdown-option' onClick={() => handleMute()}>
        Mute User
      </div>
      <div className='dropdown-option' onClick={() => setOpenMenu(false)}>
        Block User
      </div>
      <div className='dropdown-option' onClick={() => setOpenMenu(false)}>
        Report User
      </div>
    </div>
  );
};

export const DMChannelHeader = () => {
  const { dmChannel, setDmChannel } = useEventContext();
  const [openMenu, setOpenMenu] = useState(false);

  const user = dmChannel && dmChannel.state.membership.user?.id;

  const channelTitle =
    dmChannel && Object.keys(dmChannel?.state.members).filter((key) => key !== user);

  const handleCloseDm = () => {
    setDmChannel(undefined);
  };

  return (
    <>
      <div className='dm-header-container'>
        <div className='dm-header-close' onClick={handleCloseDm}>
          <CloseX />
        </div>
        <div className='dm-header-title'>
          <div>{channelTitle}</div>
          <div className='dm-header-title-sub-title'>Direct Message</div>
        </div>
        <div className='dm-header-actions' onClick={() => setOpenMenu(!openMenu)}>
          <Ellipse />
        </div>
      </div>
      {openMenu && <DropDown dmChannel={dmChannel} setOpenMenu={setOpenMenu} />}
    </>
  );
};
