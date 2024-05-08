import { AnyLocalAttachment } from '../types';
import type { DefaultStreamChatGenerics } from '../../../types';

export type AttachmentPreviewProps<
  A extends AnyLocalAttachment,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachment: A;
  handleRetry: (
    attachment: AnyLocalAttachment<StreamChatGenerics>,
  ) => void | Promise<AnyLocalAttachment | undefined>;
  removeAttachments: (ids: string[]) => void;
};
