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
    // inline,
    message: propMessage,
    messageWrapperRef,
    mine,
  } = props;

  const { mutes } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('MessageActions');
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

  const isMuted = useCallback(() => isUserMuted(message, mutes), [message, mutes]);

  const hideOptions = useCallback(() => setActionsBoxOpen(false), []);
  const messageActions = getMessageActions();
  const messageDeletedAt = !!message?.deleted_at;
  const escapePressHandler = useCallback((event) => {
    if (event?.keyCode === 27) {
      hideOptions();
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
      document.addEventListener('keydown', escapePressHandler);
    } else {
      document.removeEventListener('click', hideOptions);
      document.removeEventListener('keydown', escapePressHandler);
    }

    return () => document.removeEventListener('click', hideOptions);
  }, [actionsBoxOpen, hideOptions]);

  if (!messageActions.length && !customMessageActions) return null;

  const defaultWrapperClass =
    'str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options';

  const wrapperClass = customWrapperClass || defaultWrapperClass;

  const onClickOptionsAction = (event: React.BaseSyntheticEvent) => {
    event.stopPropagation();
    setActionsBoxOpen(true);
  };

  return (
    // <MessageActionsWrapper
    //   customWrapperClass={customWrapperClass}
    //   inline={inline}
    //   setActionsBoxOpen={setActionsBoxOpen}
    // >
    <button
      aria-expanded={actionsBoxOpen}
      aria-haspopup='true'
      aria-label={'Open Message Actions Selector'}
      className={wrapperClass}
      data-testid={'message-actions'}
      onClick={onClickOptionsAction}
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
    </button>
    // </MessageActionsWrapper>
  );
};

export type MessageActionsWrapperProps = {
  setActionsBoxOpen: React.Dispatch<React.SetStateAction<boolean>>;
  customWrapperClass?: string;
  inline?: boolean;
};

// const MessageActionsWrapper: React.FC<MessageActionsWrapperProps> = (props) => {
//   const { children, customWrapperClass, inline, setActionsBoxOpen } = props;

// const defaultWrapperClass =
// 'str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options';

// const wrapperClass = customWrapperClass || defaultWrapperClass;

// const onClickOptionsAction = (event: React.BaseSyntheticEvent) => {
//   event.stopPropagation();
//   setActionsBoxOpen(true);
// };

// const wrapperProps = {
//   className: wrapperClass,
//   'data-testid': 'message-actions',
//   onClick: onClickOptionsAction,
// };

// if (inline) return <span {...wrapperProps}>{children}</span>;

// return <div {...wrapperProps}>{children}</div>;
// };
