import { AnyLocalAttachment, LocalAttachment } from '../types';
import type { DefaultStreamChatGenerics } from '../../../types';

export type AttachmentPreviewProps<
  A extends LocalAttachment,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachment: A;
  handleRetry: (
    attachment: AnyLocalAttachment<StreamChatGenerics>,
  ) => void | Promise<AnyLocalAttachment | undefined>;
  removeAttachments: (ids: string[]) => void;
};
