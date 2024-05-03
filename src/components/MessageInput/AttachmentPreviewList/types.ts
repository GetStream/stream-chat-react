import type { LocalAttachment } from '../types';

export type AttachmentPreviewProps<A extends LocalAttachment = LocalAttachment> = {
  attachment: A;
  handleRetry: (attachment: A) => void | Promise<A | undefined>;
  removeAttachments: (ids: string[]) => void;
};
