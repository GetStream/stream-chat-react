import React from 'react';
import { useChatContext, useMessageContext } from 'stream-chat-react';

import { CopyMessage, FlagMessage, MuteUser, PinMessage } from '../../assets';
import { useViewContext, UserActions } from '../../contexts/ViewContext';

import type { Channel, UserResponse } from 'stream-chat';

import './ActionsModal.scss';

type Props = {
  userActionType: UserActions;
  dmChannel?: Channel;
  messageActionUser?: string;
  participantProfile?: UserResponse;
};

export const ActionsModal: React.FC<Props> = (props) => {
  const { dmChannel, messageActionUser, participantProfile, userActionType } = props;

  const { client } = useChatContext();
  const { setActionsModalOpenId, setSnackbar, setUserActionType } = useViewContext();
  const { message } = useMessageContext();

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
      Icon = FlagMessage;
      title = 'Flag message';
      description = 'You will flag this message for moderation by the chat admin.';
      break;

    case 'copy':
      Icon = CopyMessage;
      title = 'Copy Message';
      description = !message.text
        ? 'No text to copy'
        : message.text.length > 20
        ? `"${message.text.slice(0, 18)}..."`
        : `"${message.text.slice(0, 20)}"`;
      break;

    case 'pin':
      Icon = PinMessage;
      title = 'Pin message';
      description = 'You will pin this message to the conversation.';
      break;

    case 'unpin':
      Icon = PinMessage;
      title = 'Unpin message';
      description = 'You will unpin this message from the conversation.';
      break;
  }

  const handleCancel = () => {
    setActionsModalOpenId('');
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
        await client.flagMessage(message.id);
      } else if (action === 'copy') {
        if (message.text) await navigator.clipboard.writeText(message.text);
      } else if (action === 'pin') {
        await client.pinMessage(message.id);
      } else if (action === 'unpin') {
        await client.unpinMessage(message.id);
      }
    } catch (err) {
      console.log(err);
    }

    setActionsModalOpenId('');
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
          <div onClick={handleCancel}>CANCEL</div>
          <div onClick={() => handleAction(userActionType)}>
            {title.split(' ')[0].toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};
