import type { MessageComposer, ScheduledMessageResponse } from 'stream-chat';

export const openScheduledMessageInComposer = (
  messageComposer: MessageComposer,
  scheduledMessage: ScheduledMessageResponse,
) => messageComposer.scheduledMessageComposition.editScheduledMessage(scheduledMessage);
