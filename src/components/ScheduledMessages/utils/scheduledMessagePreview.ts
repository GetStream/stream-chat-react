import type { LocalMessageBase, ScheduledMessageResponse } from 'stream-chat';

import type { ScheduledMessagePreviewSource } from '../types';

export const toScheduledMessagePreview = (
  { attachments, id, text }: ScheduledMessagePreviewSource,
  now: Date,
): LocalMessageBase => {
  const previewMessage: LocalMessageBase = {
    attachments,
    created_at: now,
    deleted_at: null,
    id,
    pinned_at: null,
    status: 'pending',
    text,
    type: 'regular',
    updated_at: now,
  };

  return previewMessage;
};

export const toStoredScheduledMessagePreview = (
  scheduledMessage: ScheduledMessageResponse,
): LocalMessageBase => {
  const { id, message, scheduled_at } = scheduledMessage;
  const { attachments = [], text } = message;

  const previewMessage = toScheduledMessagePreview(
    { attachments, id, text },
    new Date(scheduled_at),
  );

  return previewMessage;
};
