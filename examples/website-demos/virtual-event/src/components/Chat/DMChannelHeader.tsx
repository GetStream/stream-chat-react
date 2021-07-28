import React, { useEffect, useState } from 'react';
import { Channel } from 'stream-chat';

import { CloseX } from '../../assets/CloseX';
import { Ellipse } from '../../assets/Ellipse';

import './DMChannelHeader.scss';

const DropDown = ({
  dmChannel,
  setOpenMenu,
}: {
  dmChannel: Channel;
  setOpenMenu: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [isChannelMuted, setIsChannelMuted] = useState(false);

  useEffect(() => {
    const muted = dmChannel.muteStatus().muted;
    setIsChannelMuted(muted);
  }, [dmChannel]);

  const handleMute = async () => {
    isChannelMuted ? await dmChannel.unmute() : await dmChannel.mute();
    setOpenMenu(false);
  };

  return (
    <div className='dropdown'>
      <div className='dropdown-option' onClick={() => handleMute()}>
        {isChannelMuted ? 'UnmuteUser' : 'Mute User'}
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

type Props = {
  dmChannel: Channel;
  setDmChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>;
};

export const DMChannelHeader: React.FC<Props> = (props) => {
  const { dmChannel, setDmChannel } = props;
  const [openMenu, setOpenMenu] = useState(false);

  const user = dmChannel.state.membership.user?.id;

  const channelTitle = Object.keys(dmChannel.state.members).filter((key) => key !== user);

  const handleCloseDm = () => setDmChannel(undefined);

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
