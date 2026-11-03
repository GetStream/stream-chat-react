import { dateToNs, toScheduledMessagePreview } from 'stream-chat';
import type { LocalMessage, ScheduledMessageResponse, UserResponse } from 'stream-chat';

import type { ScheduledMessagePreviewSource } from '../types';

export const toStoredScheduledMessagePreview = (
  scheduledMessage: ScheduledMessageResponse,
): LocalMessage => toScheduledMessagePreview(scheduledMessage);

export const toComposedScheduledMessagePreview = (
  { attachments, cid, id, text }: ScheduledMessagePreviewSource,
  user: UserResponse,
  now: Date,
): LocalMessage => {
  const timestamp = dateToNs(now);

  const scheduledMessage: ScheduledMessageResponse = {
    cid,
    created_at: timestamp,
    id,
    message: { attachments, custom: {}, text },
    scheduled_at: timestamp,
    status: 'scheduled',
    updated_at: timestamp,
    user,
  };

  const previewMessage = toScheduledMessagePreview(scheduledMessage);

  return previewMessage;
};
