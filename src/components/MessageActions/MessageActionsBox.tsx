import React, { useCallback, useState } from 'react';

import { MESSAGE_ACTIONS } from '../Message/utils';

import { useChannelActionContext } from '../../context/ChannelActionContext';
import {
  CustomMessageActions,
  MessageContextValue,
  useMessageContext,
} from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type CustomMessageActionsType<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  customMessageActions: CustomMessageActions<At, Ch, Co, Ev, Me, Re, Us>;
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
};

const CustomMessageActionsList = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: CustomMessageActionsType<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { customMessageActions, message } = props;
  const customActionsArray = Object.keys(customMessageActions);

  return (
    <>
      {customActionsArray.map((customAction) => {
        const customHandler = customMessageActions[customAction];

        return (
          <button key={customAction} onClick={(event) => customHandler(message, event)}>
            <li className='str-chat__message-actions-list-item'>{customAction}</li>
          </button>
        );
      })}
    </>
  );
};

type PropsDrilledToMessageActionsBox =
  | 'getMessageActions'
  | 'handleDelete'
  | 'handleEdit'
  | 'handleFlag'
  | 'handleMute'
  | 'handlePin';

export type MessageActionsBoxProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, PropsDrilledToMessageActionsBox> & {
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
    mine,
    open = false,
  } = props;

  const { setQuotedMessage } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>(
    'MessageActionsBox',
  );
  const { customMessageActions, message, messageListRect } = useMessageContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >('MessageActionsBox');

  const { t } = useTranslationContext('MessageActionsBox');

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
          setReverse(!!messageListRect && containerRect.left < messageListRect.left);
        } else {
          setReverse(!!messageListRect && containerRect.right + 5 > messageListRect.right);
        }
      }
    },
    [messageListRect, mine, open],
  );

  const handleQuote = () => {
    setQuotedMessage(message);

    const elements = document.getElementsByClassName('str-chat__textarea__textarea');
    const textarea = elements.item(0);

    if (textarea instanceof HTMLTextAreaElement) {
      textarea.focus();
    }
  };

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
        {customMessageActions && (
          <CustomMessageActionsList customMessageActions={customMessageActions} message={message} />
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.quote) > -1 &&
          !message.parent_id &&
          !message.quoted_message && (
            <button onClick={handleQuote}>
              <li className='str-chat__message-actions-list-item'>{t('Reply')}</li>
            </button>
          )}
        {messageActions.indexOf(MESSAGE_ACTIONS.pin) > -1 && !message.parent_id && (
          <button onClick={handlePin}>
            <li className='str-chat__message-actions-list-item'>
              {!message.pinned ? t('Pin') : t('Unpin')}
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
              {isUserMuted() ? t('Unmute') : t('Mute')}
            </li>
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 && (
          <button onClick={handleEdit}>
            <li className='str-chat__message-actions-list-item'>{t('Edit Message')}</li>
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 && (
          <button onClick={handleDelete}>
            <li className='str-chat__message-actions-list-item'>{t('Delete')}</li>
          </button>
        )}
      </ul>
    </div>
  );
};

/**
 * A popup box that displays the available actions on a message, such edit, delete, pin, etc.
 */
export const MessageActionsBox = React.memo(
  UnMemoizedMessageActionsBox,
) as typeof UnMemoizedMessageActionsBox;
