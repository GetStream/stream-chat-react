import React from 'react';
import { useComponentContext } from '../../context/ComponentContext';
import { FileIcon } from '../FileIcon';
import type { Attachment } from 'stream-chat';

import {
  FileSizeIndicator as DefaultFileSizeIndicator,
  DownloadButton,
} from './components';

export type FileAttachmentProps = {
  attachment: Attachment;
};

export const FileAttachment = ({ attachment }: FileAttachmentProps) => {
  const { AttachmentFileIcon, FileSizeIndicator = DefaultFileSizeIndicator } =
    useComponentContext();
  const FileIconComponent = AttachmentFileIcon ?? FileIcon;
  return (
    <div
      className='str-chat__message-attachment-file--item'
      data-testid='attachment-file'
    >
      <FileIconComponent
        className='str-chat__file-icon'
        fileName={attachment.title}
        mimeType={attachment.mime_type}
      />
      <div className='str-chat__message-attachment-file--item__info'>
        <div className='str-chat__message-attachment-file--item__first-row'>
          <div
            className='str-chat__message-attachment-file--item__name'
            data-testid='file-title'
          >
            {attachment.title}
          </div>
        </div>
        <div className='str-chat__message-attachment-file--item__data'>
          <FileSizeIndicator fileSize={attachment.file_size} />
        </div>
      </div>
      <DownloadButton
        assetUrl={attachment.asset_url}
        suggestedFileName={attachment.title}
      />
    </div>
  );
};
