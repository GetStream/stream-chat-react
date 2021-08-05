import React from 'react';

import './UserActionsModal.scss';

import { CloseSnackbar, MuteUser, ReportUser } from '../../assets';
import { UserActions } from '../../contexts/EventContext';

type Props = {
  setSnackbar: React.Dispatch<React.SetStateAction<boolean>>;
  userActionType: UserActions;
};

export const Snackbar: React.FC<Props> = (props) => {
  const { setSnackbar, userActionType } = props;

  let Icon;
  let title;

  switch (userActionType) {
    case 'mute':
      Icon = MuteUser;
      title = 'User successfully muted';
      break;

    case 'unmute':
      Icon = MuteUser;
      title = 'User successfully unmuted';
      break;

    case 'report':
      Icon = ReportUser;
      title = 'User successfully flagged';
      break;
  }

  if (!Icon || !title) return null;

  return (
    <div className='snackbar'>
      <Icon />
      <div>{title}</div>
      <CloseSnackbar setSnackbar={setSnackbar} />
    </div>
  );
};
