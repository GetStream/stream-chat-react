import React from 'react';
import type { Attachment } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type UnsupportedAttachmentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachment: Attachment<StreamChatGenerics>;
};

export const UnsupportedAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachment,
}: UnsupportedAttachmentProps<StreamChatGenerics>) => (
  <div>
    <div>
      Unsupported attachment type <strong>{attachment.type ?? 'unknown'}</strong>
    </div>
    <code>{JSON.stringify(attachment, null, 4)}</code>;
  </div>
);

export const NullComponent = () => null;
