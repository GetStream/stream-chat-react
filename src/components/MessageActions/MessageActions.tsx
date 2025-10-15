import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import React, { useCallback, useRef } from 'react';

import { MessageActionsBox } from './MessageActionsBox';

import { DialogAnchor, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import { ActionsIcon as DefaultActionsIcon } from '../Message/icons';
import { isUserMuted, shouldRenderMessageActions } from '../Message/utils';

import { useChatContext } from '../../context/ChatContext';
import type { MessageContextValue } from '../../context/MessageContext';
import { useMessageContext } from '../../context/MessageContext';
import { useComponentContext, useTranslationContext } from '../../context';

import type { IconProps } from '../../types/types';

type MessageContextPropsToPick =
  | 'getMessageActions'
  | 'handleDelete'
  | 'handleFlag'
  | 'handleMarkUnread'
  | 'handleMute'
  | 'handlePin'
  | 'message';

export type MessageActionsProps = Partial<
  Pick<MessageContextValue, MessageContextPropsToPick>
> & {
  /* Custom component rendering the icon used in message actions button. This button invokes the message actions menu. */
  ActionsIcon?: React.ComponentType<IconProps>;
  /* Custom CSS class to be added to the `div` wrapping the component */
  customWrapperClass?: string;
  /* If true, renders the wrapper component as a `span`, not a `div` */
  inline?: boolean;
  /* Function that returns whether the message was sent by the connected user */
  mine?: () => boolean;
};

export const MessageActions = (props: MessageActionsProps) => {
  const {
    ActionsIcon = DefaultActionsIcon,
    customWrapperClass = '',
    getMessageActions: propGetMessageActions,
    handleDelete: propHandleDelete,
    handleFlag: propHandleFlag,
    handleMarkUnread: propHandleMarkUnread,
    handleMute: propHandleMute,
    handlePin: propHandlePin,
    inline,
    message: propMessage,
    mine,
  } = props;

  const { mutes } = useChatContext('MessageActions');

  const {
    customMessageActions,
    getMessageActions: contextGetMessageActions,
    handleDelete: contextHandleDelete,
    handleFlag: contextHandleFlag,
    handleMarkUnread: contextHandleMarkUnread,
    handleMute: contextHandleMute,
    handlePin: contextHandlePin,
    isMyMessage,
    message: contextMessage,
    setEditingState,
    threadList,
  } = useMessageContext('MessageActions');

  const { CustomMessageActionsList } = useComponentContext('MessageActions');

  const { t } = useTranslationContext('MessageActions');

  const getMessageActions = propGetMessageActions || contextGetMessageActions;
  const handleDelete = propHandleDelete || contextHandleDelete;
  const handleFlag = propHandleFlag || contextHandleFlag;
  const handleMarkUnread = propHandleMarkUnread || contextHandleMarkUnread;
  const handleMute = propHandleMute || contextHandleMute;
  const handlePin = propHandlePin || contextHandlePin;
  const message = propMessage || contextMessage;
  const isMine = mine ? mine() : isMyMessage();

  const isMuted = useCallback(() => isUserMuted(message, mutes), [message, mutes]);

  const dialogIdNamespace = threadList ? '-thread-' : '';
  const dialogId = `message-actions${dialogIdNamespace}--${message.id}`;
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  const messageActions = getMessageActions();

  const renderMessageActions = shouldRenderMessageActions({
    customMessageActions,
    CustomMessageActionsList,
    inThread: threadList,
    messageActions,
  });

  const actionsBoxButtonRef = useRef<HTMLButtonElement | null>(null);

  if (!renderMessageActions) return null;

  return (
    <MessageActionsWrapper
      customWrapperClass={customWrapperClass}
      inline={inline}
      toggleOpen={dialog?.toggle}
    >
      <DialogAnchor
        dialogManagerId={dialogManager?.id}
        id={dialogId}
        placement={isMine ? 'top-end' : 'top-start'}
        referenceElement={actionsBoxButtonRef.current}
        tabIndex={-1}
        trapFocus
      >
        <MessageActionsBox
          getMessageActions={getMessageActions}
          handleDelete={handleDelete}
          handleEdit={setEditingState}
          handleFlag={handleFlag}
          handleMarkUnread={handleMarkUnread}
          handleMute={handleMute}
          handlePin={handlePin}
          isUserMuted={isMuted}
          mine={isMine}
          open={dialogIsOpen}
        />
      </DialogAnchor>
      <button
        aria-expanded={dialogIsOpen}
        aria-haspopup='true'
        aria-label={t('aria/Open Message Actions Menu')}
        className='str-chat__message-actions-box-button'
        data-testid='message-actions-toggle-button'
        ref={actionsBoxButtonRef}
      >
        <ActionsIcon className='str-chat__message-action-icon' />
      </button>
    </MessageActionsWrapper>
  );
};

export type MessageActionsWrapperProps = {
  customWrapperClass?: string;
  inline?: boolean;
  toggleOpen?: () => void;
};

export const MessageActionsWrapper = (
  props: PropsWithChildren<MessageActionsWrapperProps>,
) => {
  const { children, customWrapperClass, inline, toggleOpen } = props;

  const defaultWrapperClass = clsx(
    'str-chat__message-simple__actions__action',
    'str-chat__message-simple__actions__action--options',
    'str-chat__message-actions-container',
  );

  const wrapperProps = {
    className: customWrapperClass || defaultWrapperClass,
    'data-testid': 'message-actions',
    onClick: toggleOpen,
  };

  if (inline) return <span {...wrapperProps}>{children}</span>;

  return <div {...wrapperProps}>{children}</div>;
};
