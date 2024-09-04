import clsx from 'clsx';
import React, { ElementRef, PropsWithChildren, useCallback, useEffect, useRef } from 'react';

import { MessageActionsBox } from './MessageActionsBox';

import { DialogAnchor, useDialog, useDialogIsOpen } from '../Dialog';
import { ActionsIcon as DefaultActionsIcon } from '../Message/icons';
import { isUserMuted } from '../Message/utils';
import { useChatContext } from '../../context/ChatContext';
import { MessageContextValue, useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context';

import type { DefaultStreamChatGenerics, IconProps } from '../../types/types';

type MessageContextPropsToPick =
  | 'getMessageActions'
  | 'handleDelete'
  | 'handleFlag'
  | 'handleMarkUnread'
  | 'handleMute'
  | 'handlePin'
  | 'message';

export type MessageActionsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Partial<Pick<MessageContextValue<StreamChatGenerics>, MessageContextPropsToPick>> & {
  /* Custom component rendering the icon used in message actions button. This button invokes the message actions menu. */
  ActionsIcon?: React.ComponentType<IconProps>;
  /* Custom CSS class to be added to the `div` wrapping the component */
  customWrapperClass?: string;
  /* If true, renders the wrapper component as a `span`, not a `div` */
  inline?: boolean;
  /* React mutable ref that can be placed on the message root `div` of MessageActions component */
  messageWrapperRef?: React.RefObject<HTMLDivElement>;
  /* Function that returns whether the message was sent by the connected user */
  mine?: () => boolean;
};

export const MessageActions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageActionsProps<StreamChatGenerics>,
) => {
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
    messageWrapperRef,
    mine,
  } = props;

  const { mutes } = useChatContext<StreamChatGenerics>('MessageActions');
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
  } = useMessageContext<StreamChatGenerics>('MessageActions');

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

  const dialogId = `message-actions--${message.id}`;
  const dialog = useDialog({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId);

  const hideOptions = useCallback(
    (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') {
        return;
      }
      dialog?.close();
    },
    [dialog],
  );
  const messageActions = getMessageActions();
  const messageDeletedAt = !!message?.deleted_at;

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
    if (!dialogIsOpen) return;

    document.addEventListener('keyup', hideOptions);

    return () => {
      document.removeEventListener('keyup', hideOptions);
    };
  }, [dialog, dialogIsOpen, hideOptions]);

  const actionsBoxButtonRef = useRef<ElementRef<'button'>>(null);

  if (!messageActions.length && !customMessageActions) return null;

  return (
    <MessageActionsWrapper
      customWrapperClass={customWrapperClass}
      inline={inline}
      toggleOpen={dialog?.toggleSingle}
    >
      <DialogAnchor
        className={clsx('str-chat__message-actions-box', {
          'str-chat__message-actions-box--open': dialogIsOpen,
        })}
        id={dialogId}
        placement={isMine ? 'top-end' : 'top-start'}
        referenceElement={actionsBoxButtonRef.current}
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
        />
      </DialogAnchor>
      <button
        aria-expanded={dialogIsOpen}
        aria-haspopup='true'
        aria-label={t('aria/Open Message Actions Menu')}
        className='str-chat__message-actions-box-button'
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

const MessageActionsWrapper = (props: PropsWithChildren<MessageActionsWrapperProps>) => {
  const { children, customWrapperClass, inline, toggleOpen } = props;

  const defaultWrapperClass = `
  str-chat__message-simple__actions__action
  str-chat__message-simple__actions__action--options
  str-chat__message-actions-container`;

  const wrapperProps = {
    className: customWrapperClass || defaultWrapperClass,
    'data-testid': 'message-actions',
    onClick: toggleOpen,
  };

  if (inline) return <span {...wrapperProps}>{children}</span>;

  return <div {...wrapperProps}>{children}</div>;
};
