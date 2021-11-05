import React from 'react';
import { useChatContext, useMessageContext } from 'stream-chat-react';

import { Copy, FlagMessage, MuteUser, PinMessage, Trashcan } from '../../assets';
import { useActionsContext, UserActions } from '../../contexts/ActionsContext';

import './ActionsModal.scss';

type Props = {
  userActionType: UserActions;
  actionId?: string;
};

export const ActionsModal: React.FC<Props> = (props) => {
  const { actionId, userActionType } = props;

  const { setActionsModalOpenId, setSnackbar, setUserActionType } = useActionsContext();
  const { client } = useChatContext();
  const { message } = useMessageContext();

  let Icon;
  let title;
  let description;

  switch (userActionType) {
    case 'mute':
      Icon = MuteUser;
      title = 'Mute User';
      description = "You won't receive any more notifications from them.";
      break;

    case 'unmute':
      Icon = MuteUser;
      title = 'Unmute User';
      description = 'You will resume receiving notifications from them.';
      break;

    case 'flag':
      Icon = FlagMessage;
      title = 'Flag Message';
      description = 'You will flag this message for moderation by the chat admin.';
      break;

    case 'copy':
      Icon = Copy;
      title = 'Copy Message';
      description = !message.text
        ? 'No text to copy'
        : message.text.length > 20
        ? `"${message.text.slice(0, 18)}..."`
        : `"${message.text.slice(0, 20)}"`;
      break;

    case 'pin':
      Icon = PinMessage;
      title = 'Pin Message';
      description = 'You will pin this message to the conversation.';
      break;

    case 'unpin':
      Icon = PinMessage;
      title = 'Unpin Message';
      description = 'You will unpin this message from the conversation.';
      break;

    case 'delete':
      Icon = Trashcan;
      title = 'Delete Message';
      description = 'Are you sure you want to permanently delete this message?';
      break;

    case 'muteChannel':
      Icon = MuteUser;
      title = 'Mute Channel';
      description = "You won't receive any unread notifications for this channel.";
      break;

    case 'unmuteChannel':
      Icon = MuteUser;
      title = 'Unmute Channel';
      description = 'You will resume receiving channel unread notifications.';
      break;
  }

  const handleCancel = () => {
    setActionsModalOpenId('');
    setUserActionType(undefined);
  };

  const handleAction = async (action: UserActions) => {
    const actionUserId = actionId;

    if (!actionUserId) return;

    try {
      if (action === 'mute') {
        console.log('actionUserId in mute:', actionUserId);
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
      } else if (action === 'delete') {
        await client.deleteMessage(message.id);
      } else if (action === 'muteChannel') {
        // await channel.mute(channel);
      } else if (action === 'unmuteChannel') {
        // await channel.unMute(channel);
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
        <div className={`actions-modal-content ${userActionType === 'delete' ? 'delete' : ''}`}>
          <Icon />
          <div>{title}</div>
          <div>{description}</div>
        </div>
        <div className='actions-modal-buttons'>
          <button onClick={handleCancel}>CANCEL</button>
          <button onClick={() => handleAction(userActionType)}>
            {title.split(' ')[0].toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};
