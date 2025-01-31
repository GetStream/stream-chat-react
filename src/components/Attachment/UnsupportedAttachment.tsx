import React from 'react';
import { FileIcon } from '../ReactFileUtilities';
import { useTranslationContext } from '../../context';
import type { Attachment } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type UnsupportedAttachmentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  attachment: Attachment<StreamChatGenerics>;
};

export const UnsupportedAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  attachment,
}: UnsupportedAttachmentProps<StreamChatGenerics>) => {
  const { t } = useTranslationContext('UnsupportedAttachment');
  return (
    <div
      className='str-chat__message-attachment-unsupported'
      data-testid='attachment-unsupported'
    >
      <FileIcon className='str-chat__file-icon' />
      <div className='str-chat__message-attachment-unsupported__metadata'>
        <div
          className='str-chat__message-attachment-unsupported__title'
          data-testid='unsupported-attachment-title'
        >
          {attachment.title || t<string>('Unsupported attachment')}
        </div>
      </div>
    </div>
  );
};
