import React from 'react';
import { FileIcon } from '../FileIcon';
import type { Attachment } from 'stream-chat';

import { FileSizeIndicator } from './components';

export type FileAttachmentProps = {
  attachment: Attachment;
};

const UnMemoizedFileAttachment = ({ attachment }: FileAttachmentProps) => (
  <div className='str-chat__message-attachment-file--item' data-testid='attachment-file'>
    <FileIcon className='str-chat__file-icon' mimeType={attachment.mime_type} />
    <div className='str-chat__message-attachment-file--item__info'>
      <div className='str-chat__message-attachment-file--item__first-row'>
        <div
          className='str-chat__message-attachment-file--item__name'
          data-testid='file-title'
        >
          {attachment.title}
        </div>
        {/*<DownloadButton assetUrl={attachment.asset_url} />*/}
      </div>
      <div className='str-chat__message-attachment-file--item__data'>
        <FileSizeIndicator fileSize={attachment.file_size} />
      </div>
    </div>
  </div>
);

export const FileAttachment = React.memo(
  UnMemoizedFileAttachment,
) as typeof UnMemoizedFileAttachment;
