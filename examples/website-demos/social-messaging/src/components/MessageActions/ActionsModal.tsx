import React from 'react';
import { useChatContext, useMessageContext } from 'stream-chat-react';

import { CopyMessage, DeleteMessage, FlagMessage, MuteUser, PinMessage } from '../../assets';
import { useViewContext, UserActions } from '../../contexts/ViewContext';

import './ActionsModal.scss';

type Props = {
  userActionType: UserActions;
  messageActionUser?: string;
};

export const ActionsModal: React.FC<Props> = (props) => {
  const { messageActionUser, userActionType } = props;

  const { client } = useChatContext();
  const { setActionsModalOpenId, setSnackbar, setUserActionType } = useViewContext();
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
      title = 'Pin Message';
      description = 'You will pin this message to the conversation.';
      break;

    case 'unpin':
      Icon = PinMessage;
      title = 'Unpin Message';
      description = 'You will unpin this message from the conversation.';
      break;

    case 'delete':
      Icon = DeleteMessage;
      title = 'Delete Message';
      description = 'Are you sure you want to permanently delete this message?';
      break;
  }

  const handleCancel = () => {
    setActionsModalOpenId('');
    setUserActionType(undefined);
  };

  const handleAction = async (action: UserActions) => {
    const actionUserId = messageActionUser;

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
      } else if (action === 'delete') {
        await client.deleteMessage(message.id);
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
          <div onClick={handleCancel}>CANCEL</div>
          <div onClick={() => handleAction(userActionType)}>
            {title.split(' ')[0].toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};
