import React from 'react';
import { FileIcon } from '../../ReactFileUtilities';
import { CloseIcon, DownloadIcon, LoadingIndicatorIcon, RetryIcon } from '../icons';
import type { AttachmentPreviewProps } from './types';
import type { LocalAttachmentCast } from '../types';
import type { DefaultStreamChatGenerics } from '../../../types';

type FileLikeAttachment = {
  asset_url?: string;
  mime_type?: string;
  title?: string;
};

export type FileAttachmentPreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = AttachmentPreviewProps<LocalAttachmentCast<FileLikeAttachment>, StreamChatGenerics>;

export const FileAttachmentPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachment,
  handleRetry,
  removeAttachments,
}: FileAttachmentPreviewProps<StreamChatGenerics>) => (
  <div className='str-chat__attachment-preview-file' data-testid='attachment-preview-file'>
    <div className='str-chat__attachment-preview-file-icon'>
      <FileIcon filename={attachment.title} mimeType={attachment.mime_type} version='2' />
    </div>

    <button
      className='str-chat__attachment-preview-delete'
      data-testid='file-preview-item-delete-button'
      disabled={attachment.localMetadata?.uploadState === 'uploading'}
      onClick={() =>
        attachment.localMetadata?.id && removeAttachments([attachment.localMetadata?.id])
      }
    >
      <CloseIcon />
    </button>

    {attachment.localMetadata?.uploadState === 'failed' && !!handleRetry && (
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
      {attachment.localMetadata?.uploadState === 'finished' && !!attachment.asset_url && (
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
      {attachment.localMetadata?.uploadState === 'uploading' && <LoadingIndicatorIcon size={17} />}
    </div>
  </div>
);
