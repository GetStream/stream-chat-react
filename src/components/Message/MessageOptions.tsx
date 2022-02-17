import React from 'react';

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
  displayLeft?: boolean;
  displayReplies?: boolean;
  messageWrapperRef?: React.RefObject<HTMLDivElement>;
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
    displayLeft = true,
    displayReplies = true,
    handleOpenThread: propHandleOpenThread,
    messageWrapperRef,
    ReactionIcon = DefaultReactionIcon,
    theme = 'simple',
    ThreadIcon = DefaultThreadIcon,
  } = props;

  const {
    customMessageActions,
    getMessageActions,
    handleOpenThread: contextHandleOpenThread,
    initialMessage,
    isMyMessage,
    message,
    onReactionListClick,
    threadList,
  } = useMessageContext<StreamChatGenerics>('MessageOptions');

  const handleOpenThread = propHandleOpenThread || contextHandleOpenThread;

  const messageActions = getMessageActions();
  const showActionsBox = showMessageActionsBox(messageActions) || !!customMessageActions;

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

  if (isMyMessage() && displayLeft) {
    return (
      <div className={`str-chat__message-${theme}__actions`} data-testid='message-options-left'>
        {showActionsBox && (
          <MessageActions ActionsIcon={ActionsIcon} messageWrapperRef={messageWrapperRef} />
        )}
        {shouldShowReplies && (
          <button
            aria-label='Open Thread'
            className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--thread`}
            data-testid='thread-action'
            onClick={handleOpenThread}
          >
            <ThreadIcon />
          </button>
        )}
        {shouldShowReactions && (
          <button
            aria-label='Open Reaction Selector'
            className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--reactions`}
            data-testid='message-reaction-action'
            onClick={onReactionListClick}
          >
            <ReactionIcon />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`str-chat__message-${theme}__actions`} data-testid='message-options'>
      {shouldShowReactions && (
        <button
          aria-label='Open Reaction Selector'
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--reactions`}
          data-testid='message-reaction-action'
          onClick={onReactionListClick}
        >
          <ReactionIcon />
        </button>
      )}
      {shouldShowReplies && (
        <button
          aria-label='Open Thread'
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--thread`}
          data-testid='thread-action'
          onClick={handleOpenThread}
        >
          <ThreadIcon />
        </button>
      )}
      {showActionsBox && (
        <MessageActions ActionsIcon={ActionsIcon} messageWrapperRef={messageWrapperRef} />
      )}
    </div>
  );
};

export const MessageOptions = React.memo(
  UnMemoizedMessageOptions,
) as typeof UnMemoizedMessageOptions;
