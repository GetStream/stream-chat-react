import { useCallback } from 'react';
import type { LocalUploadAttachment } from 'stream-chat';
import { useMessageComposerController } from '../hooks';
import { uploadAttachmentIfEnabled } from '../uploadAttachmentIfEnabled';

/** Returns a handler that retries a failed attachment upload in place. */
export const useRetryAttachmentUpload = () => {
  const { attachmentManager } = useMessageComposerController();

  return useCallback(
    (attachment: LocalUploadAttachment) =>
      uploadAttachmentIfEnabled(attachmentManager, attachment),
    [attachmentManager],
  );
};
