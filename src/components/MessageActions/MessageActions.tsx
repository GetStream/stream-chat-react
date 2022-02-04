import React, { useCallback, useEffect, useState } from 'react';

import { MessageActionsBox } from './MessageActionsBox';

import { ActionsIcon as DefaultActionsIcon } from '../Message/icons';
import { isUserMuted } from '../Message/utils';

import { useChatContext } from '../../context/ChatContext';
import { MessageContextValue, useMessageContext } from '../../context/MessageContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

type MessageContextPropsToPick =
  | 'getMessageActions'
  | 'handleDelete'
  | 'handleFlag'
  | 'handleMute'
  | 'handlePin'
  | 'message';

export type MessageActionsProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Partial<Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, MessageContextPropsToPick>> & {
  ActionsIcon?: React.FunctionComponent;
  customWrapperClass?: string;
  /** @deprecated */
  inline?: boolean;
  messageWrapperRef?: React.RefObject<HTMLDivElement>;
  mine?: () => boolean;
};

export const MessageActions = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageActionsProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    ActionsIcon = DefaultActionsIcon,
    customWrapperClass = '',
    getMessageActions: propGetMessageActions,
    handleDelete: propHandleDelete,
    handleFlag: propHandleFlag,
    handleMute: propHandleMute,
    handlePin: propHandlePin,
    inline,
    message: propMessage,
    messageWrapperRef,
    mine,
  } = props;

  const { mutes, textareaRef } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('MessageActions');
  const {
    customMessageActions,
    getMessageActions: contextGetMessageActions,
    handleDelete: contextHandleDelete,
    handleFlag: contextHandleFlag,
    handleMute: contextHandleMute,
    handlePin: contextHandlePin,
    isMyMessage,
    message: contextMessage,
    setEditingState,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>('MessageActions');

  const getMessageActions = propGetMessageActions || contextGetMessageActions;
  const handleDelete = propHandleDelete || contextHandleDelete;
  const handleFlag = propHandleFlag || contextHandleFlag;
  const handleMute = propHandleMute || contextHandleMute;
  const handlePin = propHandlePin || contextHandlePin;
  const message = propMessage || contextMessage;

  const [actionsBoxOpen, setActionsBoxOpen] = useState(false);
  const [focusedAction, setFocusedAction] = useState<number>(0);

  const isMuted = useCallback(() => isUserMuted(message, mutes), [message, mutes]);

  const hideOptions = useCallback(() => setActionsBoxOpen(false), []);

  const messageActions = getMessageActions();
  const messageDeletedAt = !!message?.deleted_at;

  const handleKeyPress = useCallback((event) => {
    const actionsBox = document.querySelector('.str-chat__message-actions-box--open');
    const actionElements = actionsBox?.querySelectorAll('.str-chat__message-actions-list-item');

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedAction((prevFocused) => {
        if (actionElements) {
          return prevFocused === 0 ? actionElements?.length - 1 : prevFocused - 1;
        } else return 0;
      });
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedAction((prevFocused) => {
        if (actionElements) {
          return prevFocused === actionElements?.length - 1 ? 0 : prevFocused + 1;
        } else return 0;
      });
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter') setFocusedAction(0);

    if (event.key === 'Escape') {
      setActionsBoxOpen(false);
      // event.stopPropagation(); ?????
      // setMessageToggle(!messageToggle) ??????
      textareaRef?.current?.focus();
      // setFocusMessage(!focusMessage);
    }
  }, []);

  useEffect(() => {
    if (messageWrapperRef?.current) {
      messageWrapperRef.current.addEventListener('mouseleave', hideOptions);
    }
  }, [hideOptions, messageWrapperRef]);

  useEffect(() => {
    if (messageDeletedAt) {
      document.removeEventListener('click', hideOptions);
    }
  }, [hideOptions, messageDeletedAt]);

  useEffect(() => {
    if (actionsBoxOpen) {
      document.addEventListener('click', hideOptions);
      document.addEventListener('keydown', handleKeyPress);
      const actionsBox = document.querySelector('.str-chat__message-actions-box--open');
      const actionElements = actionsBox?.querySelectorAll('.str-chat__message-actions-list-item');

      if (actionElements) {
        (actionElements[focusedAction] as HTMLElement)?.focus();
      }
    } else {
      document.removeEventListener('click', hideOptions);
      document.removeEventListener('keydown', handleKeyPress);
    }

    return () => document.removeEventListener('click', hideOptions);
  }, [actionsBoxOpen, focusedAction, hideOptions]);

  if (!messageActions.length && !customMessageActions) return null;

  return (
    <MessageActionsWrapper
      actionsBoxOpen={actionsBoxOpen}
      customWrapperClass={customWrapperClass}
      inline={inline}
      setActionsBoxOpen={setActionsBoxOpen}
    >
      <MessageActionsBox
        getMessageActions={getMessageActions}
        handleDelete={handleDelete}
        handleEdit={setEditingState}
        handleFlag={handleFlag}
        handleMute={handleMute}
        handlePin={handlePin}
        isUserMuted={isMuted}
        mine={mine ? mine() : isMyMessage()}
        open={actionsBoxOpen}
      />
      <ActionsIcon />
    </MessageActionsWrapper>
  );
};

export type MessageActionsWrapperProps = {
  actionsBoxOpen: boolean;
  setActionsBoxOpen: React.Dispatch<React.SetStateAction<boolean>>;
  customWrapperClass?: string;
  inline?: boolean;
};

const MessageActionsWrapper: React.FC<MessageActionsWrapperProps> = (props) => {
  const { actionsBoxOpen, children, customWrapperClass, inline, setActionsBoxOpen } = props;

  const defaultWrapperClass =
    'str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options';

  const wrapperClass = customWrapperClass || defaultWrapperClass;

  const onClickOptionsAction = (event: React.BaseSyntheticEvent) => {
    event.stopPropagation();
    setActionsBoxOpen(!actionsBoxOpen);
  };

  const wrapperProps = {
    className: wrapperClass,
    'data-testid': 'message-actions',
    onClick: onClickOptionsAction,
  };

  if (inline)
    return (
      <span
        aria-expanded={actionsBoxOpen}
        aria-haspopup='true'
        aria-label={'Open Message Actions Selector'}
        onKeyPress={onClickOptionsAction}
        role='button'
        tabIndex={0}
        {...wrapperProps}
      >
        {children}
      </span>
    );

  return (
    <a
      aria-expanded={actionsBoxOpen}
      aria-haspopup='true'
      aria-label={'Open Message Actions Selector'}
      onKeyPress={onClickOptionsAction}
      role='button'
      tabIndex={0}
      {...wrapperProps}
    >
      {children}
    </a>
  );
};
