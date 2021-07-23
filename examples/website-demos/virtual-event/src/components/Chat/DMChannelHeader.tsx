import React from 'react';
import { useState } from 'react';
import { CloseX } from '../../assets/CloseX';
import { Ellipse } from '../../assets/Ellipse';
import { useEventContext } from '../../contexts/EventContext';

import './DMChannelHeader.scss';

const DropDown = () => {
  return (
    <div className='dropdown'>
      <div className='dropdown-option'>Mute User</div>
      <div className='dropdown-option'>Block User</div>
      <div className='dropdown-option'>Report User</div>
    </div>
  );
};

export const DMChannelHeader = () => {
  const { dmChannel, setDmChannel } = useEventContext();
  const [openMenu, setOpenMenu] = useState(false);

  console.log({ dmChannel });

  //@ts-expect-error
  const channelTitle = dmChannel?.data?.created_by?.id;
  console.log(channelTitle);

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
      {openMenu && <DropDown />}
    </>
  );
};
