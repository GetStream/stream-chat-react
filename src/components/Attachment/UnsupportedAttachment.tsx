import React from 'react';
import type { Attachment } from 'stream-chat';

import { FileIcon } from '../FileIcon';
import { useComponentContext, useTranslationContext } from '../../context';

export type UnsupportedAttachmentProps = {
  attachment: Attachment;
};

export const UnsupportedAttachment = ({ attachment }: UnsupportedAttachmentProps) => {
  const { t } = useTranslationContext('UnsupportedAttachment');
  const { AttachmentFileIcon } = useComponentContext();
  const FileIconComponent = AttachmentFileIcon ?? FileIcon;
  return (
    <div
      className='str-chat__message-attachment-unsupported'
      data-testid='attachment-unsupported'
    >
      <FileIconComponent
        className='str-chat__file-icon'
        fileName={attachment.title}
        mimeType={attachment.mime_type}
      />
      <div className='str-chat__message-attachment-unsupported__metadata'>
        <div
          className='str-chat__message-attachment-unsupported__title'
          data-testid='unsupported-attachment-title'
        >
          {attachment.title || t('Unsupported attachment')}
        </div>
      </div>
    </div>
  );
};
