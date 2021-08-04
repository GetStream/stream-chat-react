import React from 'react';

import './UserActionsModal.scss';

import { BlockUser, MuteUser, ReportUser } from '../../assets';
import { UserActions } from '../../contexts/EventContext';

type Props = {
  userActionType: UserActions;
};

export const UserActionsModal: React.FC<Props> = (props) => {
  const { userActionType } = props;

  // const handleMute = async () => {
  //   if (dmChannel) {
  //     isChannelMuted ? await dmChannel.unmute() : await dmChannel.mute();
  //     setDropdownOpen(false);
  //   }
  // };

  return (
    <div className='actions'>
      <div className='actions-modal'>
        <div className='actions-modal-top'>
          <BlockUser />
          <MuteUser />
          <ReportUser />
          {userActionType}
        </div>
      </div>
    </div>
  );
};
