import React, { useCallback, useState } from 'react';
import clsx from 'clsx';

import { MESSAGE_ACTIONS } from '../Message/utils';

import { useChannelActionContext } from '../../context/ChannelActionContext';
import {
  CustomMessageActions,
  MessageContextValue,
  useMessageContext,
} from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type CustomMessageActionsType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  customMessageActions: CustomMessageActions<StreamChatGenerics>;
  message: StreamMessage<StreamChatGenerics>;
};

const CustomMessageActionsList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: CustomMessageActionsType<StreamChatGenerics>,
) => {
  const { customMessageActions, message } = props;
  const customActionsArray = Object.keys(customMessageActions);

  return (
    <>
      {customActionsArray.map((customAction) => {
        const customHandler = customMessageActions[customAction];

        return (
          <button
            aria-selected='false'
            className='str-chat__message-actions-list-item str-chat__message-actions-list-item-button'
            key={customAction}
            onClick={(event) => customHandler(message, event)}
            role='option'
          >
            {customAction}
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<MessageContextValue<StreamChatGenerics>, PropsDrilledToMessageActionsBox> & {
  isUserMuted: () => boolean;
  mine: boolean;
  open: boolean;
};

const UnMemoizedMessageActionsBox = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageActionsBoxProps<StreamChatGenerics>,
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

  const { setQuotedMessage } = useChannelActionContext<StreamChatGenerics>('MessageActionsBox');
  const { customMessageActions, message, messageListRect } = useMessageContext<StreamChatGenerics>(
    'MessageActionsBox',
  );

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

    const elements = message.parent_id
      ? document.querySelectorAll('.str-chat__thread .str-chat__textarea__textarea')
      : document.getElementsByClassName('str-chat__textarea__textarea');
    const textarea = elements.item(0);

    if (textarea instanceof HTMLTextAreaElement) {
      textarea.focus();
    }
  };

  const rootClassName = clsx('str-chat__message-actions-box', {
    'str-chat__message-actions-box--mine': mine,
    'str-chat__message-actions-box--open': open,
    'str-chat__message-actions-box--reverse': reverse,
  });
  const buttonClassName =
    'str-chat__message-actions-list-item str-chat__message-actions-list-item-button';

  return (
    <div className={rootClassName} data-testid='message-actions-box' ref={checkIfReverse}>
      <div aria-label='Message Options' className='str-chat__message-actions-list' role='listbox'>
        {customMessageActions && (
          <CustomMessageActionsList customMessageActions={customMessageActions} message={message} />
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.quote) > -1 && (
          <button
            aria-selected='false'
            className={buttonClassName}
            onClick={handleQuote}
            role='option'
          >
            {t<string>('Reply')}
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.pin) > -1 && !message.parent_id && (
          <button
            aria-selected='false'
            className={buttonClassName}
            onClick={handlePin}
            role='option'
          >
            {!message.pinned ? t<string>('Pin') : t<string>('Unpin')}
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1 && (
          <button
            aria-selected='false'
            className={buttonClassName}
            onClick={handleFlag}
            role='option'
          >
            {t<string>('Flag')}
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1 && (
          <button
            aria-selected='false'
            className={buttonClassName}
            onClick={handleMute}
            role='option'
          >
            {isUserMuted() ? t<string>('Unmute') : t<string>('Mute')}
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 && (
          <button
            aria-selected='false'
            className={buttonClassName}
            onClick={handleEdit}
            role='option'
          >
            {t<string>('Edit Message')}
          </button>
        )}
        {messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 && (
          <button
            aria-selected='false'
            className={buttonClassName}
            onClick={handleDelete}
            role='option'
          >
            {t<string>('Delete')}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * A popup box that displays the available actions on a message, such as edit, delete, pin, etc.
 */
export const MessageActionsBox = React.memo(
  UnMemoizedMessageActionsBox,
) as typeof UnMemoizedMessageActionsBox;
