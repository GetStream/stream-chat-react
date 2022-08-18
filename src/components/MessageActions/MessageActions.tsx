import { usePopper } from 'react-popper';
import React, {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { MessageActionsBox } from './MessageActionsBox';

import { ActionsIcon as DefaultActionsIcon } from '../Message/icons';
import { isUserMuted } from '../Message/utils';
import { Modal } from '../Modal/Modal';
import { Portal } from '../Modal/Portal';

import { useChatContext } from '../../context/ChatContext';
import { MessageContextValue, useMessageContext } from '../../context/MessageContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

type MessageContextPropsToPick =
  | 'getMessageActions'
  | 'handleDelete'
  | 'handleFlag'
  | 'handleMute'
  | 'handlePin'
  | 'message';

export type MessageActionsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Partial<Pick<MessageContextValue<StreamChatGenerics>, MessageContextPropsToPick>> & {
  /** Wrapping element to which the modal with MessageActionsBox can be appended. By default, the wrapping message list container is used */
  actionsBoxModalContainer?: Element;
  /** Wrapping element id to which the modal with MessageActionsBox can be appended. By default, the wrapping message list container id is used */
  actionsBoxModalContainerId?: string;
  /** Custom component rendered on the message actions button */
  ActionsIcon?: React.FunctionComponent;
  /** Custom class that overrides the default class on the message actions wrapper element */
  customWrapperClass?: string;
  inline?: boolean;
  /** Function determines whether the enclosing message was posted me */
  mine?: () => boolean;
  /** Sets the flag that allows to set visibility class on the message options root element */
  setMessageOptionsVisible?: Dispatch<SetStateAction<boolean>>;
};

export const MessageActions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageActionsProps<StreamChatGenerics>,
) => {
  const { mutes } = useChatContext<StreamChatGenerics>('MessageActions');
  const {
    customMessageActions,
    getMessageActions: contextGetMessageActions,
    handleDelete: contextHandleDelete,
    handleFlag: contextHandleFlag,
    handleMute: contextHandleMute,
    handlePin: contextHandlePin,
    isMyMessage,
    message: contextMessage,
    messageListContainer,
    messageListContainerId,
    setEditingState,
  } = useMessageContext<StreamChatGenerics>('MessageActions');

  const {
    actionsBoxModalContainer = messageListContainer,
    actionsBoxModalContainerId = messageListContainerId,
    ActionsIcon = DefaultActionsIcon,
    customWrapperClass = '',
    getMessageActions: propGetMessageActions,
    handleDelete: propHandleDelete,
    handleFlag: propHandleFlag,
    handleMute: propHandleMute,
    handlePin: propHandlePin,
    inline,
    message: propMessage,
    mine,
    setMessageOptionsVisible,
  } = props;

  const belongsToMyMessage = useMemo(() => (mine ? mine() : isMyMessage()), [mine, isMyMessage]);

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // todo: make the positioning configurable
  const { attributes, styles } = usePopper(referenceElement, popperElement, {
    placement: belongsToMyMessage ? 'left-start' : 'right-start',
  });

  const getMessageActions = propGetMessageActions || contextGetMessageActions;
  const handleDelete = propHandleDelete || contextHandleDelete;
  const handleFlag = propHandleFlag || contextHandleFlag;
  const handleMute = propHandleMute || contextHandleMute;
  const handlePin = propHandlePin || contextHandlePin;
  const message = propMessage || contextMessage;

  const [actionsBoxOpen, setActionsBoxOpen] = useState(false);

  const isMuted = useCallback(() => isUserMuted(message, mutes), [message, mutes]);

  const messageActions = getMessageActions();

  const closeActionsBox = () => {
    setMessageOptionsVisible?.(false);
    setActionsBoxOpen(false);
  };

  const openActionsBox = (event: React.BaseSyntheticEvent) => {
    event.stopPropagation();
    setMessageOptionsVisible?.(true);
    setActionsBoxOpen(true);
  };

  if (!messageActions.length && !customMessageActions) return null;

  return (
    <>
      {actionsBoxOpen && (
        <Portal container={actionsBoxModalContainer} containerId={actionsBoxModalContainerId}>
          <Modal
            className={{ overlay: 'str-chat__message-actions-box--modal-overlay' }}
            hideCloseButton
            innerContainerProps={{
              style: styles.popper,
              ...attributes.popper,
              onClick: closeActionsBox,
            }}
            onClose={closeActionsBox}
            open={actionsBoxOpen}
            setInnerContainer={setPopperElement}
          >
            <MessageActionsBox
              getMessageActions={getMessageActions}
              handleDelete={handleDelete}
              handleEdit={setEditingState}
              handleFlag={handleFlag}
              handleMute={handleMute}
              handlePin={handlePin}
              isUserMuted={isMuted}
              mine={belongsToMyMessage}
            />
          </Modal>
        </Portal>
      )}
      <MessageActionsWrapper customWrapperClass={customWrapperClass} inline={inline}>
        <button
          aria-expanded={actionsBoxOpen}
          aria-haspopup='true'
          aria-label='Open Message Actions Menu'
          className='str-chat__message-actions-box-button'
          data-testid='message-actions-button'
          onClick={openActionsBox}
          ref={setReferenceElement}
        >
          <ActionsIcon className='str-chat__message-action-icon' />
        </button>
      </MessageActionsWrapper>
    </>
  );
};

export type MessageActionsWrapperProps = {
  customWrapperClass?: string;
  inline?: boolean;
};

const MessageActionsWrapper = (props: PropsWithChildren<MessageActionsWrapperProps>) => {
  const { children, customWrapperClass, inline } = props;

  const defaultWrapperClass = `
  str-chat__message-simple__actions__action
  str-chat__message-simple__actions__action--options
  str-chat__message-actions-container`;

  const wrapperClass = customWrapperClass || defaultWrapperClass;

  const wrapperProps = {
    className: wrapperClass,
    'data-testid': 'message-actions',
  };

  if (inline) return <span {...wrapperProps}>{children}</span>;

  return <div {...wrapperProps}>{children}</div>;
};
