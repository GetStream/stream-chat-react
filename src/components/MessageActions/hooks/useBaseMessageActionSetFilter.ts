import { useMemo } from 'react';

import { ACTIONS_NOT_WORKING_IN_THREAD, useUserRole } from '../../../components';
import { useChannelStateContext, useMessageContext } from '../../../context';

import type { MessageActionSetItem } from '../MessageActions';

/**
 * Base filter hook which covers actions of type `delete`, `edit`,
 * `flag`, `markUnread`, `mute`, `quote`, `react` and `reply`, whether
 * the rendered message is a reply (replies are limited to certain actions) and
 * whether the message has appropriate type and status.
 */
export const useBaseMessageActionSetFilter = (
  messageActionSet: MessageActionSetItem[],
  disable = false,
) => {
  const { initialMessage: isInitialMessage, message } = useMessageContext();
  const { channelConfig } = useChannelStateContext();
  const {
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canQuote,
    canReact,
    canReply,
  } = useUserRole(message);
  const isMessageThreadReply = typeof message.parent_id === 'string';

  return useMemo(() => {
    if (disable) return messageActionSet;

    // filter out all actions if any of these are true
    if (
      isInitialMessage || // not sure whether this thing even works anymore
      !message.type ||
      message.type === 'error' ||
      message.type === 'system' ||
      message.type === 'ephemeral' ||
      message.status === 'failed' ||
      message.status === 'sending'
    )
      return [];

    return messageActionSet.filter(({ type }: MessageActionSetItem) => {
      // filter out actions with types that do not work in thread
      if (ACTIONS_NOT_WORKING_IN_THREAD.includes(type) && isMessageThreadReply)
        return false;

      if (
        (type === 'delete' && !canDelete) ||
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
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canQuote,
    canReact,
    canReply,
    channelConfig,
    isInitialMessage,
    isMessageThreadReply,
    message.status,
    message.type,
    disable,
    messageActionSet,
  ]);
};
