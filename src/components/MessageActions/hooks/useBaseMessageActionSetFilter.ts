import { useMemo } from 'react';

import { useChannelStateContext, useMessageContext } from '../../../context';
import { useUserRole } from '../../Message/hooks';
import {
  ACTIONS_NOT_WORKING_IN_THREAD,
  isMessageBounced,
  isMessageDeleted,
  isMessageErrorRetryable,
  isNetworkSendFailure,
} from '../../Message/utils';

import type { MessageActionSetItem } from '../MessageActions';
import {
  isAudioAttachment,
  isFileAttachment,
  isImageAttachment,
  isVideoAttachment,
  isVoiceRecordingAttachment,
} from 'stream-chat';

/**
 * Base filter hook which covers actions of type `delete`, `edit`,
 * `flag`, `markUnread`, `mute`, `quote`, `react` and `reply`, whether
 * the rendered message is a reply (replies are limited to certain actions) and
 * whether the message has appropriate type and status (including soft-deleted).
 */
export const useBaseMessageActionSetFilter = (
  messageActionSet: MessageActionSetItem[],
  disable = false,
) => {
  const { initialMessage: isInitialMessage, message } = useMessageContext();
  const { channelConfig } = useChannelStateContext();
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
  } = useUserRole(message);
  const isMessageThreadReply = typeof message.parent_id === 'string';
  const isBounced = isMessageBounced(message);
  const allowRetry = isMessageErrorRetryable(message);
  const hasNetworkSendFailure = isNetworkSendFailure(message);

  return useMemo(() => {
    if (disable) return messageActionSet;

    // filter out all actions if any of these are true
    if (
      isBounced ||
      isInitialMessage || // not sure whether this thing even works anymore
      !message.type ||
      message.type === 'system' ||
      message.type === 'ephemeral' ||
      message.status === 'sending'
    )
      return [];

    return messageActionSet.filter((action) => {
      if (action.placement === 'quick-dropdown-toggle') return true;

      const type = action.type;

      // filter out actions with types that do not work in thread
      if (ACTIONS_NOT_WORKING_IN_THREAD.includes(type) && isMessageThreadReply)
        return false;

      // failed message menu has special treatment
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
        (type === 'copyMessageText' && !message.text) ||
        (type === 'download' &&
          !message.attachments?.some(
            (attachment) =>
              isFileAttachment(attachment) ||
              isImageAttachment(attachment) ||
              isVideoAttachment(attachment) ||
              isAudioAttachment(attachment) ||
              isVoiceRecordingAttachment(attachment),
          )) ||
        (type === 'delete' && (!canDelete || messageIsDeleted)) ||
        (type === 'edit' && !canEdit) ||
        (type === 'flag' && !canFlag) ||
        (type === 'markUnread' && !canMarkUnread) ||
        (type === 'mute' && !canMute) ||
        (type === 'quote' && !canQuote) ||
        (type === 'react' && !canReact) ||
        (type === 'reply' && !canReply) ||
        (type === 'remindMe' && !channelConfig?.['user_message_reminders']) ||
        (type === 'saveForLater' && !channelConfig?.['user_message_reminders'])
      )
        return false;

      return true;
    });
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
    channelConfig,
    isBounced,
    isInitialMessage,
    messageIsDeleted,
    isMessageThreadReply,
    message.error,
    message.attachments,
    message.status,
    message.text,
    message.type,
    disable,
    hasNetworkSendFailure,
    messageActionSet,
  ]);
};
