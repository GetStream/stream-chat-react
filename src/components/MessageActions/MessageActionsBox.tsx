import React, { useCallback, useEffect, useRef, useState } from 'react';

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
          <button
            aria-selected='false'
            className='str-chat__message-actions-list-item'
            key={customAction}
            onClick={(event) => customHandler(message, event)}
            // ref={actionRef}
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
  const [focusedAction, setFocusedAction] = useState<number>(0);

  const actionBoxRef = useRef<HTMLDivElement>(null);

  const messageActions = getMessageActions();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // console.log(actionBoxRef.current, event.target);

      // if (
      //   actionBoxRef &&
      //   event.target instanceof HTMLElement &&
      //   actionBoxRef.current?.contains(event.target)
      // ) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusedAction((prevFocused) => {
          if (prevFocused === undefined) return 0;
          return prevFocused === 0 ? actionsLength - 1 : prevFocused - 1;
        });
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusedAction((prevFocused) => {
          if (prevFocused === undefined) return 0;
          return prevFocused === actionsLength - 1 ? 0 : prevFocused + 1;
        });
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        return;
      }
      // }
    },
    [focusedAction],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown, false);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, open]);

  const actions: any = {
    deleteAction: [messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1],
    editAction: [messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1],
    flagAction: [messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1],
    muteAction: [messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1],
    pinAction: [messageActions.indexOf(MESSAGE_ACTIONS.pin) > -1],
    quoteAction: [messageActions.indexOf(MESSAGE_ACTIONS.quote) > -1],
  };

  const actionsLength = Object.values(actions).filter((a: any) => a === true).length;

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

  const ActionItem = (props: any) => {
    const { action, index } = props;

    const focused = focusedAction === index;

    const actionRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (actionRef.current && focused) {
        actionRef.current.focus();
      }
    }, [focused]);

    if (action === 'quote') {
      return (
        <>
          {messageActions.indexOf(MESSAGE_ACTIONS.quote) > -1 &&
            !message.parent_id &&
            !message.quoted_message && (
              <button
                aria-selected='false'
                className='str-chat__message-actions-list-item'
                onClick={handleQuote}
                ref={actionRef}
                role='option'
              >
                {t('Reply')}
              </button>
            )}
        </>
      );
    }

    if (action === 'pin') {
      return (
        <>
          {messageActions.indexOf(MESSAGE_ACTIONS.pin) > -1 && !message.parent_id && (
            <button
              aria-selected='false'
              className='str-chat__message-actions-list-item'
              onClick={handlePin}
              ref={actionRef}
              role='option'
            >
              {!message.pinned ? t('Pin') : t('Unpin')}
            </button>
          )}
        </>
      );
    }

    if (action === 'flag') {
      return (
        <>
          {messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1 && (
            <button
              aria-selected='false'
              className='str-chat__message-actions-list-item'
              onClick={handleFlag}
              ref={actionRef}
              role='option'
            >
              {t('Flag')}
            </button>
          )}
        </>
      );
    }

    if (action === 'mute') {
      return (
        <>
          {messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1 && (
            <button
              aria-selected='false'
              className='str-chat__message-actions-list-item'
              onClick={handleMute}
              ref={actionRef}
              role='option'
            >
              {isUserMuted() ? t('Unmute') : t('Mute')}
            </button>
          )}
        </>
      );
    }

    if (action === 'edit') {
      return (
        <>
          {messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 && (
            <button
              aria-selected='false'
              className='str-chat__message-actions-list-item'
              onClick={handleEdit}
              ref={actionRef}
              role='option'
            >
              {t('Edit Message')}
            </button>
          )}
        </>
      );
    }

    if (action === 'delete') {
      return (
        <>
          {messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 && (
            <button
              aria-selected='false'
              className='str-chat__message-actions-list-item'
              onClick={handleDelete}
              ref={actionRef}
              role='option'
            >
              {t('Delete')}
            </button>
          )}
        </>
      );
    } else return null;
  };

  const orderedActions = ['quote', 'pin', 'flag', 'mute', 'edit', 'delete'];

  return (
    <div
      className={`str-chat__message-actions-box
        ${open ? 'str-chat__message-actions-box--open' : ''}
        ${mine ? 'str-chat__message-actions-box--mine' : ''}
        ${reverse ? 'str-chat__message-actions-box--reverse' : ''}
      `}
      data-testid='message-actions-box'
      ref={checkIfReverse}
      // ref={actionBoxRef}
    >
      <div
        aria-label='Message Options'
        className='str-chat__message-actions-list'
        ref={actionBoxRef}
        role='listbox'
      >
        {customMessageActions && (
          <CustomMessageActionsList customMessageActions={customMessageActions} message={message} />
        )}
        {/* {messageActions.map((action, index) => ( */}
        {orderedActions.map((action, index) => (
          <ActionItem action={action} index={index} key={index} />
        ))}
        {/* <ActionBox /> */}
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
