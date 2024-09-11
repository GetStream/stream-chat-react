import clsx from 'clsx';
import React from 'react';

import {
  ActionsIcon as DefaultActionsIcon,
  ReactionIcon as DefaultReactionIcon,
  ThreadIcon as DefaultThreadIcon,
} from './icons';
import { MESSAGE_ACTIONS } from './utils';
import { MessageActions } from '../MessageActions';
import { useDialogIsOpen } from '../Dialog';
import { ReactionSelectorWithButton } from '../Reactions/ReactionSelectorWithButton';

import { useMessageContext, useTranslationContext } from '../../context';

import type { DefaultStreamChatGenerics, IconProps } from '../../types/types';
import type { MessageContextValue } from '../../context/MessageContext';

export type MessageOptionsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Partial<Pick<MessageContextValue<StreamChatGenerics>, 'handleOpenThread'>> & {
  /* Custom component rendering the icon used in message actions button. This button invokes the message actions menu. */
  ActionsIcon?: React.ComponentType<IconProps>;
  /* If true, show the `ThreadIcon` and enable navigation into a `Thread` component. */
  displayReplies?: boolean;
  /* Custom component rendering the icon used in a button invoking reactions selector for a given message. */
  ReactionIcon?: React.ComponentType<IconProps>;
  /* Theme string to be added to CSS class names. */
  theme?: string;
  /* Custom component rendering the icon used in a message options button opening thread */
  ThreadIcon?: React.ComponentType<IconProps>;
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
    getMessageActions,
    handleOpenThread: contextHandleOpenThread,
    initialMessage,
    message,
    threadList,
  } = useMessageContext<StreamChatGenerics>('MessageOptions');

  const { t } = useTranslationContext('MessageOptions');
  const messageActionsDialogIsOpen = useDialogIsOpen(`message-actions--${message.id}`);
  const reactionSelectorDialogIsOpen = useDialogIsOpen(`reaction-selector--${message.id}`);
  const handleOpenThread = propHandleOpenThread || contextHandleOpenThread;

  const messageActions = getMessageActions();

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

  return (
    <div
      className={clsx(`str-chat__message-${theme}__actions str-chat__message-options`, {
        'str-chat__message-options--active':
          messageActionsDialogIsOpen || reactionSelectorDialogIsOpen,
      })}
      data-testid='message-options'
    >
      <MessageActions ActionsIcon={ActionsIcon} />
      {shouldShowReplies && (
        <button
          aria-label={t('aria/Open Thread')}
          className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--thread str-chat__message-reply-in-thread-button`}
          data-testid='thread-action'
          onClick={handleOpenThread}
        >
          <ThreadIcon className='str-chat__message-action-icon' />
        </button>
      )}
      {shouldShowReactions && (
        <ReactionSelectorWithButton ReactionIcon={ReactionIcon} theme={theme} />
      )}
    </div>
  );
};

export const MessageOptions = React.memo(
  UnMemoizedMessageOptions,
) as typeof UnMemoizedMessageOptions;
