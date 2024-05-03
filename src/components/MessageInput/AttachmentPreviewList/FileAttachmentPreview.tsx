import { AttachmentPreviewProps } from './types';
import { FileIcon } from '../../ReactFileUtilities';
import { CloseIcon, DownloadIcon, LoadingIndicatorIcon, RetryIcon } from '../icons';
import React from 'react';

export type FileAttachmentPreviewProps = AttachmentPreviewProps;

export const FileAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: FileAttachmentPreviewProps) => (
  <div className='str-chat__attachment-preview-file' data-testid='attachment-preview-file'>
    <div className='str-chat__attachment-preview-file-icon'>
      <FileIcon filename={attachment.title} mimeType={attachment.mime_type} version='2' />
    </div>

    <button
      className='str-chat__attachment-preview-delete'
      data-testid='file-preview-item-delete-button'
      disabled={attachment.$internal?.uploadState === 'uploading'}
      onClick={() => attachment.$internal?.id && removeAttachments([attachment.$internal?.id])}
    >
      <CloseIcon />
    </button>

    {attachment.$internal?.uploadState === 'failed' && !!handleRetry && (
      <button
        className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file'
        data-testid='file-preview-item-retry-button'
        onClick={() => handleRetry(attachment)}
      >
        <RetryIcon />
      </button>
    )}

    <div className='str-chat__attachment-preview-file-end'>
      <div className='str-chat__attachment-preview-file-name' title={attachment.title}>
        {attachment.title}
      </div>
      {attachment.$internal?.uploadState === 'finished' && !!attachment.asset_url && (
        <a
          className='str-chat__attachment-preview-file-download'
          download
          href={attachment.asset_url}
          rel='noreferrer'
          target='_blank'
        >
          <DownloadIcon />
        </a>
      )}
      {attachment.$internal?.uploadState === 'uploading' && <LoadingIndicatorIcon size={17} />}
    </div>
  </div>
);
