import { useMemo } from 'react';

import { useChannel, useMessageContext } from '../../../context';
import { useUserRole } from '../../Message/hooks';
import {
  ACTIONS_NOT_WORKING_IN_THREAD,
  isMessageBounced,
  isMessageDeleted,
  isMessageErrorRetryable,
  isNetworkSendFailure,
} from '../../Message/utils';

import type {
  MessageActionSetItem,
  MessageActionVisibilityFilterParams,
} from '../MessageActions';
import type { ChannelConfig } from 'stream-chat';
import { useStateStore } from '../../../store';

const userMessageRemindersStateSelector = ({ userMessageReminders }: ChannelConfig) => ({
  userMessageRemindersEnabled: userMessageReminders.enabled,
});

/**
 * Filters a message action set by the user's capabilities, the features enabled on the server,
 * whether the message is a thread reply, and the message type and status (including soft-deleted
 * and failed messages). An action these allow still shows only while its own `isVisible` holds.
 *
 * @param messageActionSet - Actions to filter.
 * @param disable - Skips the checks above when true, leaving only each action's `isVisible`.
 * Defaults to false.
 * @returns The actions that apply to the message, none for bounced, initial, system, ephemeral,
 * sending or typeless messages.
 */
export const useBaseMessageActionSetFilter = (
  messageActionSet: MessageActionSetItem[],
  disable = false,
) => {
  const channel = useChannel();
  const { initialMessage: isInitialMessage, message } = useMessageContext();
  const { userMessageRemindersEnabled } = useStateStore(
    channel.configState,
    userMessageRemindersStateSelector,
  );
  const messageIsDeleted = isMessageDeleted(message);
  const {
    canBlockUser,
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canQuote,
    canReact,
    canReply,
    canSendMessage,
    isMyMessage,
  } = useUserRole(message);
  const isMessageThreadReply = typeof message.parent_id === 'string';
  const isBounced = isMessageBounced(message);
  const allowRetry = isMessageErrorRetryable(message);
  const hasNetworkSendFailure = isNetworkSendFailure(message);

  return useMemo(() => {
    const visibilityFilterParams: MessageActionVisibilityFilterParams = {
      isMyMessage,
      isThreadReply: isMessageThreadReply,
      message,
    };
    const passesOwnRule = (action: MessageActionSetItem) =>
      action.placement === 'quick-dropdown-toggle' ||
      !action.isVisible ||
      action.isVisible(visibilityFilterParams);

    if (disable) return messageActionSet.filter(passesOwnRule);

    // These messages get no actions.
    if (
      isBounced ||
      isInitialMessage || // the thread parent that `ThreadHead` renders above the replies
      !message.type ||
      message.type === 'system' ||
      message.type === 'ephemeral' ||
      message.status === 'sending'
    )
      return [];

    const allowedActions = messageActionSet.filter((action) => {
      if (action.placement === 'quick-dropdown-toggle') return true;

      const type = action.type;

      // Thread replies do not support some actions.
      if (ACTIONS_NOT_WORKING_IN_THREAD.includes(type) && isMessageThreadReply)
        return false;

      // A failed message keeps only the resend, edit and delete actions that apply to it.
      if (message.error) {
        return (
          (type === 'resendMessage' && canSendMessage && (allowRetry || isBounced)) ||
          (type === 'edit' && ((isBounced && canEdit) || hasNetworkSendFailure)) ||
          (type === 'delete' &&
            !messageIsDeleted &&
            ((isBounced && canDelete) || hasNetworkSendFailure))
        );
      }

      if (
        type === 'resendMessage' ||
        (type === 'blockUser' && !canBlockUser) ||
        (type === 'delete' && (!canDelete || messageIsDeleted)) ||
        (type === 'edit' && !canEdit) ||
        (type === 'flag' && !canFlag) ||
        (type === 'markUnread' && !canMarkUnread) ||
        (type === 'mute' && !canMute) ||
        (type === 'quote' && !canQuote) ||
        (type === 'react' && !canReact) ||
        (type === 'reply' && !canReply) ||
        (type === 'remindMe' && !userMessageRemindersEnabled) ||
        (type === 'saveForLater' && !userMessageRemindersEnabled)
      )
        return false;

      return true;
    });

    return allowedActions.filter(passesOwnRule);
  }, [
    allowRetry,
    canBlockUser,
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canQuote,
    canReact,
    canReply,
    canSendMessage,
    userMessageRemindersEnabled,
    isBounced,
    isInitialMessage,
    messageIsDeleted,
    isMessageThreadReply,
    isMyMessage,
    message,
    disable,
    hasNetworkSendFailure,
    messageActionSet,
  ]);
};
