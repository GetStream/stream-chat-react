import type { MessageComposer, ScheduledMessageResponse } from 'stream-chat';

import { isFailedScheduledMessage } from './scheduledMessageGroups';

export const openScheduledMessageInComposer = (
  messageComposer: MessageComposer,
  scheduledMessage: ScheduledMessageResponse,
) => {
  const openScheduledMessage = isFailedScheduledMessage(scheduledMessage)
    ? messageComposer.rescheduleFailedMessage
    : messageComposer.editScheduledMessage;

  return openScheduledMessage(scheduledMessage);
};
