import {
  getChannelLevelScheduledMessages,
  getThreadScheduledMessages,
} from 'stream-chat';
import type { ScheduledMessageResponse } from 'stream-chat';

import type { UseScheduledMessagesParams } from '../types';

export const getScopedScheduledMessages = (
  scheduledMessages: ScheduledMessageResponse[],
  { cid, parentId }: UseScheduledMessagesParams,
) => {
  if (parentId) return getThreadScheduledMessages(scheduledMessages, parentId);

  if (cid) return getChannelLevelScheduledMessages(scheduledMessages);

  return scheduledMessages;
};
