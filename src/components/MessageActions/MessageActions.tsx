import React, {
  ElementRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';

import { MessageActionsBox } from './MessageActionsBox';

import { ActionsIcon as DefaultActionsIcon } from '../Message/icons';
import { isUserMuted, shouldRenderMessageActions } from '../Message/utils';

import { useChatContext } from '../../context/ChatContext';
import { MessageContextValue, useMessageContext } from '../../context/MessageContext';

import type { DefaultStreamChatGenerics, IconProps } from '../../types/types';
import { useMessageActionsBoxPopper } from './hooks';
import { useComponentContext, useTranslationContext } from '../../context';

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
    threadList,
  } = useMessageContext<StreamChatGenerics>('MessageActions');

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

  const [actionsBoxOpen, setActionsBoxOpen] = useState(false);

  const isMuted = useCallback(() => isUserMuted(message, mutes), [message, mutes]);

  const messageActions = getMessageActions();

  const renderMessageActions = shouldRenderMessageActions({
    // @ts-expect-error
    customMessageActions,
    CustomMessageActionsList,
    inThread: threadList,
    messageActions,
  });

  const hideOptions = useCallback((event: MouseEvent | KeyboardEvent) => {
    if (event instanceof KeyboardEvent && event.key !== 'Escape') {
      return;
    }
    setActionsBoxOpen(false);
  }, []);
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
    if (!actionsBoxOpen) return;

    document.addEventListener('click', hideOptions);
    document.addEventListener('keyup', hideOptions);

    return () => {
      document.removeEventListener('click', hideOptions);
      document.removeEventListener('keyup', hideOptions);
    };
  }, [actionsBoxOpen, hideOptions]);

  const actionsBoxButtonRef = useRef<ElementRef<'button'>>(null);

  const { attributes, popperElementRef, styles } = useMessageActionsBoxPopper<HTMLDivElement>({
    open: actionsBoxOpen,
    placement: isMine ? 'top-end' : 'top-start',
    referenceElement: actionsBoxButtonRef.current,
  });

  if (!renderMessageActions) return null;

  return (
    <MessageActionsWrapper
      customWrapperClass={customWrapperClass}
      inline={inline}
      setActionsBoxOpen={setActionsBoxOpen}
    >
      <MessageActionsBox
        {...attributes.popper}
        getMessageActions={getMessageActions}
        handleDelete={handleDelete}
        handleEdit={setEditingState}
        handleFlag={handleFlag}
        handleMarkUnread={handleMarkUnread}
        handleMute={handleMute}
        handlePin={handlePin}
        isUserMuted={isMuted}
        mine={isMine}
        open={actionsBoxOpen}
        ref={popperElementRef}
        style={styles.popper}
      />
      <button
        aria-expanded={actionsBoxOpen}
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
  setActionsBoxOpen: React.Dispatch<React.SetStateAction<boolean>>;
  customWrapperClass?: string;
  inline?: boolean;
};

const MessageActionsWrapper = (props: PropsWithChildren<MessageActionsWrapperProps>) => {
  const { children, customWrapperClass, inline, setActionsBoxOpen } = props;

  const defaultWrapperClass = clsx(
    'str-chat__message-simple__actions__action',
    'str-chat__message-simple__actions__action--options',
    'str-chat__message-actions-container',
  );

  const wrapperClass = customWrapperClass || defaultWrapperClass;

  const onClickOptionsAction = (event: React.BaseSyntheticEvent) => {
    event.stopPropagation();
    setActionsBoxOpen((prev) => !prev);
  };

  const wrapperProps = {
    className: wrapperClass,
    'data-testid': 'message-actions',
    onClick: onClickOptionsAction,
  };

  if (inline) return <span {...wrapperProps}>{children}</span>;

  return <div {...wrapperProps}>{children}</div>;
};
