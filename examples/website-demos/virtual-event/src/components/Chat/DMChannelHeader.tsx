import React from 'react';
import { CloseX } from '../../assets/CloseX';
import { Ellipse } from '../../assets/Ellipse';
import { useEventContext } from '../../contexts/EventContext';

import './DMChannelHeader.scss';

export const DMChannelHeader = () => {
  const { dmChannel, setDmChannel } = useEventContext();

  console.log({ dmChannel });

  //@ts-expect-error
  const channelTitle = dmChannel?.data?.created_by?.id;
  console.log(channelTitle);

  const handleCloseDm = () => {
    setDmChannel(undefined);
  };

  return (
    <div className='dm-header-container'>
      <div className='dm-header-close' onClick={handleCloseDm}>
        <CloseX />
      </div>
      <div className='dm-header-title'>
        <div>{channelTitle}</div>
        <div className='dm-header-title-sub-title'>Direct Message</div>
      </div>
      <div className='dm-header-actions'>
        <Ellipse />
      </div>
    </div>
  );
};
