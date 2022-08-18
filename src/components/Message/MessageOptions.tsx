import clsx from 'clsx';
import React, { useState } from 'react';

import {
  ActionsIcon as DefaultActionsIcon,
  ReactionIcon as DefaultReactionIcon,
  ThreadIcon as DefaultThreadIcon,
} from './icons';
import { MESSAGE_ACTIONS, showMessageActionsBox } from './utils';

import { MessageActions } from '../MessageActions';

import { MessageContextValue, useMessageContext } from '../../context/MessageContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type MessageOptionsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Partial<Pick<MessageContextValue<StreamChatGenerics>, 'handleOpenThread'>> & {
  ActionsIcon?: React.FunctionComponent;
  /** @deprecated: use CSS to style the order of the contents */
  displayLeft?: boolean;
  displayReplies?: boolean;
  ReactionIcon?: React.FunctionComponent;
  theme?: string;
  ThreadIcon?: React.FunctionComponent;
};

const UnMemoizedMessageOptions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageOptionsProps<StreamChatGenerics>,
) => {
  const {
    ActionsIcon = DefaultActionsIcon,
    displayReplies = true,
    handleOpenThread: propHandleOpenThread,
    ReactionIcon = DefaultReactionIcon,
    theme = 'simple',
    ThreadIcon = DefaultThreadIcon,
  } = props;

  const {
    customMessageActions,
    getMessageActions,
    handleOpenThread: contextHandleOpenThread,
    initialMessage,
    message,
    onReactionListClick,
    threadList,
  } = useMessageContext<StreamChatGenerics>('MessageOptions');

  const [visible, setVisible] = useState(false);

  const handleOpenThread = propHandleOpenThread || contextHandleOpenThread;

  const messageActions = getMessageActions();
  const showActionsBox =
    showMessageActionsBox(messageActions, threadList) || !!customMessageActions;

  const shouldShowReactions = messageActions.indexOf(MESSAGE_ACTIONS.react) > -1;
  const shouldShowReplies =
    messageActions.indexOf(MESSAGE_ACTIONS.reply) > -1 && displayReplies && !threadList;

  if (
    !message.type ||
    message.type === 'error' ||
    message.type === 'system' ||
    message.type === 'ephemeral' ||
    message.status === 'failed' ||
    message.status === 'sending' ||
    initialMessage
  ) {
    return null;
  }

  const rootClassName = clsx(`str-chat__message-${theme}__actions str-chat__message-options`, {
    'str-chat__message-options--visible': visible,
  });

  return (
    <div className={rootClassName} data-testid='message-options'>
      {showActionsBox && (
        <MessageActions ActionsIcon={ActionsIcon} setMessageOptionsVisible={setVisible} />
      )}
      {shouldShowReplies && (
        <button
          aria-label='Open Thread'
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--thread str-chat__message-reply-in-thread-button`}
          data-testid='thread-action'
          onClick={handleOpenThread}
        >
          <ThreadIcon className='str-chat__message-action-icon' />
        </button>
      )}
      {shouldShowReactions && (
        <button
          aria-label='Open Reaction Selector'
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--reactions str-chat__message-reactions-button`}
          data-testid='message-reaction-action'
          onClick={onReactionListClick}
        >
          <ReactionIcon className='str-chat__message-action-icon' />
        </button>
      )}
    </div>
  );
};

export const MessageOptions = React.memo(
  UnMemoizedMessageOptions,
) as typeof UnMemoizedMessageOptions;
