import React from 'react';
import { FileIcon } from '../FileIcon';
import type { Attachment } from 'stream-chat';

import { DownloadButton, FileSizeIndicator } from './components';

export type FileAttachmentProps = {
  attachment: Attachment;
};

const UnMemoizedFileAttachment = ({ attachment }: FileAttachmentProps) => (
  <div className='str-chat__message-attachment-file--item' data-testid='attachment-file'>
    <FileIcon className='str-chat__file-icon' mimeType={attachment.mime_type} />
    <div className='str-chat__message-attachment-file--item-text'>
      <div className='str-chat__message-attachment-file--item-first-row'>
        <div
          className='str-chat__message-attachment-file--item-name'
          data-testid='file-title'
        >
          {attachment.title}
        </div>
        <DownloadButton assetUrl={attachment.asset_url} />
      </div>
      <FileSizeIndicator fileSize={attachment.file_size} />
    </div>
  </div>
);

export const FileAttachment = React.memo(
  UnMemoizedFileAttachment,
) as typeof UnMemoizedFileAttachment;
