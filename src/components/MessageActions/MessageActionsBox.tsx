import React, { useCallback, useState } from 'react';

import { MESSAGE_ACTIONS } from '../Message/utils';

import { useTranslationContext } from '../../context/TranslationContext';

import type { MessageActionsProps } from './MessageActions';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

type PropsDrilledToMessageActionsBox =
  | 'getMessageActions'
  | 'handleDelete'
  | 'handleEdit'
  | 'handleFlag'
  | 'handleMute'
  | 'handlePin'
  | 'message'
  | 'messageListRect';

export type MessageActionsBoxProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Pick<
  MessageActionsProps<At, Ch, Co, Ev, Me, Re, Us>,
  PropsDrilledToMessageActionsBox
> & {
  isUserMuted: () => boolean;
  mine: boolean;
  open: boolean;
};

const UnMemoizedMessageActionsBox = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageActionsBoxProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    getMessageActions,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMute,
    handlePin,
    isUserMuted,
    message,
    messageListRect,
    mine,
    open = false,
  } = props;

  const { t } = useTranslationContext();

  const [reverse, setReverse] = useState(false);

  const messageActions = getMessageActions();

  const checkIfReverse = useCallback(
    (containerElement: HTMLDivElement) => {
      if (!containerElement) {
        setReverse(false);
        return;
      }

      if (open) {
        const containerRect = containerElement.getBoundingClientRect();

        if (mine) {
          setReverse(
            !!messageListRect && containerRect.left < messageListRect.left,
          );
        } else {
          setReverse(
            !!messageListRect &&
              containerRect.right + 5 > messageListRect.right,
          );
        }
      }
    },
    [messageListRect, mine, open],
  );

  return (
    <div
      className={`str-chat__message-actions-box
        ${open ? 'str-chat__message-actions-box--open' : ''}
        ${mine ? 'str-chat__message-actions-box--mine' : ''}
        ${reverse ? 'str-chat__message-actions-box--reverse' : ''}
      `}
      data-testid='message-actions-box'
      ref={checkIfReverse}
    >
      <ul className='str-chat__message-actions-list'>
        {messageActions.indexOf(MESSAGE_ACTIONS.pin) > -1 &&
          !message?.parent_id && (
            <button onClick={handlePin}>
              <li className='str-chat__message-actions-list-item'>
                {!message?.pinned ? t('Pin') : t('Unpin')}
              </li>
            </button>
          )}
        {messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1 && (
          <button onClick={handleFlag}>
            <li className='str-chat__message-actions-list-item'>{t('Flag')}</li>
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1 && (
          <button onClick={handleMute}>
            <li className='str-chat__message-actions-list-item'>
              {isUserMuted && isUserMuted() ? t('Unmute') : t('Mute')}
            </li>
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 && (
          <button onClick={handleEdit}>
            <li className='str-chat__message-actions-list-item'>
              {t('Edit Message')}
            </li>
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 && (
          <button onClick={handleDelete}>
            <li className='str-chat__message-actions-list-item'>
              {t('Delete')}
            </li>
          </button>
        )}
      </ul>
    </div>
  );
};

/**
 * MessageActionsBox - Allows a user to edit, flag or delete a message.
 * @example ./MessageActionsBox.md
 */
export const MessageActionsBox = React.memo(
  UnMemoizedMessageActionsBox,
) as typeof UnMemoizedMessageActionsBox;
