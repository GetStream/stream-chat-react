import React from 'react';
import { useChatContext } from 'stream-chat-react';

import { FlagUser, MuteUser } from '../../assets';
import { useEventContext, UserActions } from '../../contexts/EventContext';

import type { Channel, UserResponse } from 'stream-chat';

type Props = {
  setSnackbar: React.Dispatch<React.SetStateAction<boolean>>;
  userActionType: UserActions;
  dmChannel?: Channel;
  messageActionUser?: string;
  participantProfile?: UserResponse;
};

export const UserActionsModal: React.FC<Props> = (props) => {
  const { dmChannel, messageActionUser, participantProfile, setSnackbar, userActionType } = props;

  const { client } = useChatContext();
  const { setActionsModalOpen, setUserActionType } = useEventContext();

  let Icon;
  let title;
  let description;

  switch (userActionType) {
    case 'mute':
      Icon = MuteUser;
      title = 'Mute user';
      description = "You won't receive any more notifications from them.";
      break;

    case 'unmute':
      Icon = MuteUser;
      title = 'Unmute user';
      description = 'You will resume receiving notifications from them.';
      break;

    case 'flag':
      Icon = FlagUser;
      title = 'Flag user';
      description = 'You will flag them for moderation by the chat admin.';
      break;
  }

  const handleCancel = () => {
    setActionsModalOpen(false);
    setUserActionType(undefined);
  };

  const handleAction = async (action: UserActions) => {
    const actionUserId =
      participantProfile?.id ||
      messageActionUser ||
      Object.keys(dmChannel?.state.members || []).filter((member) => member !== client.userID)[0];

    if (!actionUserId) return;

    try {
      if (action === 'mute') {
        await client.muteUser(actionUserId);
      } else if (action === 'unmute') {
        await client.unmuteUser(actionUserId);
      } else if (action === 'flag') {
        await client.flagUser(actionUserId);
      }
    } catch (err) {
      console.log(err);
    }

    setActionsModalOpen(false);
    setSnackbar(true);
    setTimeout(() => setSnackbar(false), 3000);
    setTimeout(() => setUserActionType(undefined), 3000);
  };

  if (!Icon || !title || !description) return null;

  return (
    <div className='actions'>
      <div className='actions-modal'>
        <div className='actions-modal-content'>
          <Icon />
          <div>{title}</div>
          <div>{description}</div>
        </div>
        <div className='actions-modal-buttons'>
          <div onClick={handleCancel}>Cancel</div>
          <div onClick={() => handleAction(userActionType)}>{title}</div>
        </div>
      </div>
    </div>
  );
};
