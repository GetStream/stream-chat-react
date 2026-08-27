import React from 'react';
import { useComponentContext } from '../../context/ComponentContext';
import { FileIcon } from '../FileIcon';
import type { Attachment } from 'stream-chat';

import {
  AttachmentUploadProgressIndicator as DefaultAttachmentUploadProgressIndicator,
  FileSizeIndicator as DefaultFileSizeIndicator,
  DownloadButton,
} from './components';
import { useAttachmentUploadState } from './hooks/useAttachmentUploadState';

export type FileAttachmentProps = {
  attachment: Attachment;
};

export const FileAttachment = ({ attachment }: FileAttachmentProps) => {
  const {
    AttachmentFileIcon,
    AttachmentUploadProgressIndicator = DefaultAttachmentUploadProgressIndicator,
    FileSizeIndicator = DefaultFileSizeIndicator,
  } = useComponentContext();
  const FileIconComponent = AttachmentFileIcon ?? FileIcon;
  const { isUploading } = useAttachmentUploadState(attachment);
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
          {/* While uploading, the upload progress takes the place of the file size. */}
          {isUploading ? (
            <AttachmentUploadProgressIndicator attachment={attachment} />
          ) : (
            <FileSizeIndicator fileSize={attachment.file_size} />
          )}
        </div>
      </div>
      {/* DownloadButton renders nothing without an asset_url, which a pending upload lacks. */}
      <DownloadButton
        assetUrl={attachment.asset_url}
        suggestedFileName={attachment.title}
      />
    </div>
  );
};
