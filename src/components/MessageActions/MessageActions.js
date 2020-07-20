// @ts-check
import React, { useCallback, useContext, useEffect, useState } from 'react';
import MessageActionsBox from './MessageActionsBox';
import {
  useDeleteHandler,
  useUserRole,
  useFlagHandler,
  useMuteHandler,
} from '../Message/hooks';
import { isUserMuted } from '../Message/utils';
import { ChatContext } from '../../context';

/**
 * @type { React.FC<import('types').MessageActionsProps> }
 */
export const MessageActions = (props) => {
  const {
    addNotification,
    message,
    getMessageActions,
    messageListRect,
    messageWrapperRef,
    setEditingState,
    getMuteUserSuccessNotification,
    getMuteUserErrorNotification,
    getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification,
    handleFlag: propHandleFlag,
    handleMute: propHandleMute,
    handleDelete: propHandleDelete,
    inline,
    customWrapperClass,
  } = props;
  const { mutes } = useContext(ChatContext);
  const messageActions = getMessageActions();
  const [actionsBoxOpen, setActionsBoxOpen] = useState(false);
  const { isMyMessage } = useUserRole(message);
  const handleDelete = useDeleteHandler(message);
  const handleFlag = useFlagHandler(message, {
    notify: addNotification,
    getSuccessNotification: getFlagMessageErrorNotification,
    getErrorNotification: getFlagMessageSuccessNotification,
  });
  const handleMute = useMuteHandler(message, {
    notify: addNotification,
    getErrorNotification: getMuteUserSuccessNotification,
    getSuccessNotification: getMuteUserErrorNotification,
  });
  const isMuted = useCallback(() => {
    return isUserMuted(message, mutes);
  }, [message, mutes]);

  /** @type {() => void} Typescript syntax */
  const hideOptions = useCallback(() => setActionsBoxOpen(false), []);
  const messageDeletedAt = !!message?.deleted_at;
  useEffect(() => {
    if (messageWrapperRef?.current) {
      messageWrapperRef.current.addEventListener('onMouseLeave', hideOptions);
    }
  }, [messageWrapperRef, hideOptions]);
  useEffect(() => {
    if (messageDeletedAt) {
      document.removeEventListener('click', hideOptions);
    }
  }, [messageDeletedAt, hideOptions]);

  useEffect(() => {
    if (actionsBoxOpen) {
      document.addEventListener('click', hideOptions);
    } else {
      document.removeEventListener('click', hideOptions);
    }
    return () => {
      document.removeEventListener('click', hideOptions);
    };
  }, [actionsBoxOpen, hideOptions]);
  if (messageActions.length === 0) {
    return null;
  }

  return (
    <MessageActionsWrapper
      inline={inline}
      customWrapperClass={customWrapperClass}
      setActionsBoxOpen={setActionsBoxOpen}
    >
      <MessageActionsBox
        getMessageActions={getMessageActions}
        open={actionsBoxOpen}
        messageListRect={messageListRect}
        handleFlag={propHandleFlag || handleFlag}
        isUserMuted={isMuted}
        handleMute={propHandleMute || handleMute}
        handleEdit={setEditingState}
        handleDelete={propHandleDelete || handleDelete}
        mine={isMyMessage}
      />
      <svg
        width="11"
        height="4"
        viewBox="0 0 11 4"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
          fillRule="nonzero"
        />
      </svg>
    </MessageActionsWrapper>
  );
};

/**
 * This is a workaround to encompass the different styles message actions can have at the moment
 * while allowing for sharing the component's stateful logic.
 * @type { React.FC<import('types').MessageActionsWrapperProps> }
 */
const MessageActionsWrapper = (props) => {
  const { children, customWrapperClass, inline, setActionsBoxOpen } = props;
  const defaultWrapperClass =
    'str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options';
  const wrapperClass =
    typeof customWrapperClass === 'string'
      ? customWrapperClass
      : defaultWrapperClass;
  /** @type {() => void} Typescript syntax */
  const onClickOptionsAction = () => setActionsBoxOpen(true);
  const wrapperProps = {
    'data-testid': 'message-actions',
    onClick: onClickOptionsAction,
    className: wrapperClass,
  };
  if (inline) {
    return <span {...wrapperProps}>{children}</span>;
  }
  return <div {...wrapperProps}>{children}</div>;
};
