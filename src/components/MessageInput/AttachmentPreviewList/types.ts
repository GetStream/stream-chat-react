import { LocalAttachment } from '../types';
import type { DefaultStreamChatGenerics } from '../../../types';

export type AttachmentPreviewProps<
  A extends LocalAttachment,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  attachment: A;
  handleRetry: (
    attachment: LocalAttachment<StreamChatGenerics>,
  ) => void | Promise<LocalAttachment<StreamChatGenerics> | undefined>;
  removeAttachments: (ids: string[]) => void;
};
