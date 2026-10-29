import type { LocalMessageBase } from 'stream-chat';

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
