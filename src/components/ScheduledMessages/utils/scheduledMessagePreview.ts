import type { LocalMessageBase } from 'stream-chat';

import type { ScheduledMessagePreviewSource } from '../types';

/**
 * Returns a local message built from the composer's current text and attachments, so the
 * schedule dialog can render it with the quoted message preview.
 *
 * The message is never sent; it only carries what the preview reads.
 */
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
