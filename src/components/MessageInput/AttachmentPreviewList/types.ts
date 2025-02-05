import { LocalAttachment } from '../types';

export type AttachmentPreviewProps<A extends LocalAttachment> = {
  attachment: A;
  handleRetry: (
    attachment: LocalAttachment,
  ) => void | Promise<LocalAttachment | undefined>;
  removeAttachments: (ids: string[]) => void;
};
