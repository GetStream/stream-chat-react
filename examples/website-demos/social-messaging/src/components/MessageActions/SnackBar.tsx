import React from 'react';

import { CloseSnackbar, CopyMessage, DeleteMessage, FlagMessage, MuteUser, PinMessage } from '../../assets';
import { useViewContext } from '../../contexts/ViewContext';

export const Snackbar: React.FC = () => {
  const { setSnackbar, userActionType } = useViewContext();

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
      Icon = CopyMessage;
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
      Icon = DeleteMessage;
      title = 'Message successfully deleted';
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
