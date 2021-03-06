import React, { useCallback, useEffect, useState } from 'react';

import { MessageActionsBox } from './MessageActionsBox';

import {
  useDeleteHandler,
  useFlagHandler,
  useMuteHandler,
  usePinHandler,
  useUserRole,
} from '../Message/hooks';
import {
  defaultPinPermissions,
  isUserMuted,
  MessageActionsArray,
} from '../Message/utils';

import { useChatContext } from '../../context/ChatContext';

import type { MessageUIComponentProps } from '../Message/types';

import type { StreamMessage } from '../../context/ChannelContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type MessageActionsProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Partial<MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>> & {
  getMessageActions: () => MessageActionsArray;
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  customWrapperClass?: string;
  inline?: boolean;
  messageWrapperRef?: React.RefObject<HTMLDivElement>;
};

export const MessageActions = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageActionsProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    addNotification,
    customWrapperClass,
    getMessageActions,
    getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification,
    getMuteUserErrorNotification,
    getMuteUserSuccessNotification,
    getPinMessageErrorNotification,
    handleDelete: propHandleDelete,
    handleFlag: propHandleFlag,
    handleMute: propHandleMute,
    handlePin: propHandlePin,
    inline,
    message,
    messageListRect,
    messageWrapperRef,
    pinPermissions = defaultPinPermissions,
    setEditingState,
  } = props;

  const { mutes } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const [actionsBoxOpen, setActionsBoxOpen] = useState(false);

  const { isMyMessage } = useUserRole(message);

  const handleDelete = useDeleteHandler(message);

  const handleFlag = useFlagHandler(message, {
    getErrorNotification: getFlagMessageSuccessNotification,
    getSuccessNotification: getFlagMessageErrorNotification,
    notify: addNotification,
  });

  const handleMute = useMuteHandler(message, {
    getErrorNotification: getMuteUserSuccessNotification,
    getSuccessNotification: getMuteUserErrorNotification,
    notify: addNotification,
  });

  const { handlePin } = usePinHandler(message, pinPermissions, {
    getErrorNotification: getPinMessageErrorNotification,
    notify: addNotification,
  });

  const isMuted = useCallback(() => isUserMuted(message, mutes), [
    message,
    mutes,
  ]);

  const hideOptions = useCallback(() => setActionsBoxOpen(false), []);

  const messageActions = getMessageActions();
  const messageDeletedAt = !!message?.deleted_at;

  useEffect(() => {
    if (messageWrapperRef?.current) {
      messageWrapperRef.current.addEventListener('onMouseLeave', hideOptions);
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
    } else {
      document.removeEventListener('click', hideOptions);
    }

    return () => document.removeEventListener('click', hideOptions);
  }, [actionsBoxOpen, hideOptions]);

  if (messageActions.length === 0) return null;

  return (
    <MessageActionsWrapper
      customWrapperClass={customWrapperClass}
      inline={inline}
      setActionsBoxOpen={setActionsBoxOpen}
    >
      <MessageActionsBox<At, Ch, Co, Ev, Me, Re, Us>
        getMessageActions={getMessageActions}
        handleDelete={propHandleDelete || handleDelete}
        handleEdit={setEditingState}
        handleFlag={propHandleFlag || handleFlag}
        handleMute={propHandleMute || handleMute}
        handlePin={propHandlePin || handlePin}
        isUserMuted={isMuted}
        message={message}
        messageListRect={messageListRect}
        mine={isMyMessage}
        open={actionsBoxOpen}
      />
      <svg
        height='4'
        viewBox='0 0 11 4'
        width='11'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z'
          fillRule='nonzero'
        />
      </svg>
    </MessageActionsWrapper>
  );
};

export type MessageActionsWrapperProps = {
  setActionsBoxOpen: React.Dispatch<React.SetStateAction<boolean>>;
  customWrapperClass?: string;
  inline?: boolean;
};

const MessageActionsWrapper: React.FC<MessageActionsWrapperProps> = (props) => {
  const { children, customWrapperClass, inline, setActionsBoxOpen } = props;

  const defaultWrapperClass =
    'str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options';

  const wrapperClass =
    typeof customWrapperClass === 'string'
      ? customWrapperClass
      : defaultWrapperClass;

  const onClickOptionsAction = (event: React.MouseEvent) => {
    event.stopPropagation();
    setActionsBoxOpen(true);
  };

  const wrapperProps = {
    className: wrapperClass,
    'data-testid': 'message-actions',
    onClick: onClickOptionsAction,
  };

  if (inline) return <span {...wrapperProps}>{children}</span>;

  return <div {...wrapperProps}>{children}</div>;
};
