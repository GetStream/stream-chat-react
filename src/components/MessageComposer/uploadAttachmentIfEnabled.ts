import type { AttachmentManager, LocalUploadAttachment } from 'stream-chat';

/**
 * Uploads `attachment` in place through `attachmentManager.uploadFile()`, which runs the upload
 * middleware. Does nothing while the composer accepts no uploads (`AttachmentManager.isUploadEnabled`).
 */
export const uploadAttachmentIfEnabled = (
  attachmentManager: AttachmentManager,
  attachment: LocalUploadAttachment,
) =>
  attachmentManager.isUploadEnabled
    ? attachmentManager.uploadFile(attachment)
    : undefined;
