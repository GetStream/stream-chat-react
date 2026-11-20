import { nanoid } from 'nanoid';
import type { ScheduledMessageResponse, UserResponse } from 'stream-chat';

import { convertDateToTimestamp } from './time';

const ONE_HOUR_MS = 60 * 60 * 1000;

export const generateScheduledMessage = (
  data: Partial<ScheduledMessageResponse> = {},
): ScheduledMessageResponse => {
  const now = new Date();
  const createdAt = convertDateToTimestamp(now);
  const scheduledAt = convertDateToTimestamp(new Date(now.getTime() + ONE_HOUR_MS));

  const scheduledMessage: ScheduledMessageResponse = {
    cid: 'messaging:general',
    created_at: createdAt,
    id: nanoid(),
    message: { custom: {}, text: nanoid() },
    scheduled_at: scheduledAt,
    status: 'scheduled',
    updated_at: createdAt,
    user: { id: 'user-id' } as UserResponse,
    ...data,
  };

  return scheduledMessage;
};
