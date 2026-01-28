import React from 'react';
import type { AnyLocalAttachment, LocalUploadAttachment } from 'stream-chat';
import { type LocalFileAttachment } from 'stream-chat';
import { FileAttachmentPreview } from './FileAttachmentPreview';

export type UnsupportedAttachmentPreviewProps<
  CustomLocalMetadata = Record<string, unknown>,
> = {
  attachment: AnyLocalAttachment<CustomLocalMetadata>;
  handleRetry: (
    attachment: LocalUploadAttachment,
  ) => void | Promise<LocalUploadAttachment | undefined>;
  removeAttachments: (ids: string[]) => void;
};

export const UnsupportedAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: UnsupportedAttachmentPreviewProps) => (
  <FileAttachmentPreview
    attachment={attachment as LocalFileAttachment}
    handleRetry={handleRetry}
    removeAttachments={removeAttachments}
  />
);
