import React from 'react';

import { CloseSnackbar, Copy, FlagMessage, MuteUser, PinMessage, Trashcan } from '../../assets';
import { useActionsContext } from '../../contexts/ActionsContext';

export const Snackbar: React.FC = () => {
  const { setSnackbar, userActionType } = useActionsContext();

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

    case 'flag':
      Icon = FlagMessage;
      title = 'Message successfully flagged';
      break;

    case 'copy':
      Icon = Copy;
      title = 'Message successfully copied';
      break;

    case 'pin':
      Icon = PinMessage;
      title = 'Message successfully pinned';
      break;

    case 'unpin':
      Icon = PinMessage;
      title = 'Message successfully unpinned';
      break;

    case 'delete':
      Icon = Trashcan;
      title = 'Message successfully deleted';
      break;

    case 'unmuteChannel':
      Icon = MuteUser;
      title = 'Channel successfully unmuted';
      break;

    case 'muteChannel':
      Icon = MuteUser;
      title = 'Channel successfully muted';
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
