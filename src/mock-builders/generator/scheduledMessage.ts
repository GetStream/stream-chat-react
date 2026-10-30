import { nanoid } from 'nanoid';
import type { ScheduledMessageResponse } from 'stream-chat';

const ONE_HOUR_MS = 60 * 60 * 1000;

export const generateScheduledMessage = (
  data: Partial<ScheduledMessageResponse> = {},
): ScheduledMessageResponse => {
  const now = new Date();
  const createdAt = now.toISOString();
  const scheduledAt = new Date(now.getTime() + ONE_HOUR_MS).toISOString();

  const scheduledMessage: ScheduledMessageResponse = {
    cid: 'messaging:general',
    created_at: createdAt,
    id: nanoid(),
    message: { text: nanoid() },
    scheduled_at: scheduledAt,
    status: 'scheduled',
    updated_at: createdAt,
    user: { id: 'user-id' },
    ...data,
  };

  return scheduledMessage;
};
