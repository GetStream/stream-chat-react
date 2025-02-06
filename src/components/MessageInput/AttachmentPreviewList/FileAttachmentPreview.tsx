import React from 'react';
import { FileIcon } from '../../ReactFileUtilities';
import { CloseIcon, DownloadIcon, LoadingIndicatorIcon, RetryIcon } from '../icons';
import { useTranslationContext } from '../../../context';

import type { AttachmentPreviewProps } from './types';
import type { LocalAttachmentCast, LocalAttachmentUploadMetadata } from '../types';
import type { Attachment } from 'stream-chat';

type FileLikeAttachment = Partial<
  Pick<Attachment, 'title' | 'file_size' | 'asset_url' | 'mime_type'>
>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type FileAttachmentPreviewProps<CustomLocalMetadata = {}> = AttachmentPreviewProps<
  LocalAttachmentCast<
    FileLikeAttachment,
    LocalAttachmentUploadMetadata & CustomLocalMetadata
  >
>;

export const FileAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: FileAttachmentPreviewProps) => {
  const { t } = useTranslationContext('FilePreview');
  return (
    <div
      className='str-chat__attachment-preview-file'
      data-testid='attachment-preview-file'
    >
      <div className='str-chat__attachment-preview-file-icon'>
        <FileIcon filename={attachment.title} mimeType={attachment.mime_type} />
      </div>

      <button
        aria-label={t('aria/Remove attachment')}
        className='str-chat__attachment-preview-delete'
        data-testid='file-preview-item-delete-button'
        disabled={attachment.localMetadata?.uploadState === 'uploading'}
        onClick={() =>
          attachment.localMetadata?.id &&
          removeAttachments([attachment.localMetadata?.id])
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
        {attachment.localMetadata?.uploadState === 'finished' &&
          !!attachment.asset_url && (
            <a
              aria-label={t('aria/Download attachment')}
              className='str-chat__attachment-preview-file-download'
              download
              href={attachment.asset_url}
              rel='noreferrer'
              target='_blank'
              title={t('Download attachment {{ name }}', { name: attachment.title })}
            >
              <DownloadIcon />
            </a>
          )}
        {attachment.localMetadata?.uploadState === 'uploading' && (
          <LoadingIndicatorIcon size={17} />
        )}
      </div>
    </div>
  );
};
