import type { LocalImageAttachment } from 'stream-chat';
import type { UploadAttachmentPreviewProps } from './types';

export type ImageAttachmentPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalImageAttachment<CustomLocalMetadata>>;
