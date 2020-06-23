// @ts-check
import React, { useCallback, useEffect, useState } from 'react';
import MessageActionsBox from './MessageActionsBox';
import {
  useDeleteHandler,
  useUserRole,
  useFlagHandler,
  useEditHandler,
  useMuteHandler,
} from '../Message/hooks';
import { isUserMuted } from '../Message/utils';

/**
 * @type { React.FC<import('types').MessageActionsProps> }
 */
export const MessageActions = ({
  addNotification,
  message,
  mutes,
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
  handleEdit: propHandleEdit,
  handleDelete: propHandleDelete,
}) => {
  const messageActions = getMessageActions();
  const [actionsBoxOpen, setActionsBoxOpen] = useState(false);
  const { isMyMessage } = useUserRole(message);
  const handleDelete = useDeleteHandler(message);
  const handleEdit = useEditHandler(message, setEditingState);
  const handleFlag = useFlagHandler(message, {
    notify: addNotification,
    getSuccessNotification: getMuteUserSuccessNotification,
    getErrorNotification: getMuteUserErrorNotification,
  });
  const handleMute = useMuteHandler(message, {
    notify: addNotification,
    getErrorNotification: getFlagMessageErrorNotification,
    getSuccessNotification: getFlagMessageSuccessNotification,
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
  /** @type {() => void} Typescript syntax */
  const onClickOptionsAction = () => setActionsBoxOpen(true);

  if (messageActions.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="message-actions"
      onClick={onClickOptionsAction}
      className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options"
    >
      <MessageActionsBox
        getMessageActions={getMessageActions}
        open={actionsBoxOpen}
        messageListRect={messageListRect}
        handleFlag={propHandleFlag || handleFlag}
        isUserMuted={isMuted}
        handleMute={propHandleMute || handleMute}
        handleEdit={propHandleEdit || handleEdit}
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
    </div>
  );
};
