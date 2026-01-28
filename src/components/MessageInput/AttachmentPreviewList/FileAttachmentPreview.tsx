import React from 'react';
import { useTranslationContext } from '../../../context';
import { FileIcon } from '../../FileIcon';
import { LoadingIndicatorIcon } from '../icons';

import type { LocalFileAttachment } from 'stream-chat';
import type { UploadAttachmentPreviewProps } from './types';
import { RemoveAttachmentPreviewButton } from '../RemoveAttachmentPreviewButton';
import { AttachmentPreviewRoot } from './utils/AttachmentPreviewRoot';
import { FileSizeIndicator } from '../../Attachment';
import { IconExclamationCircle, IconExclamationTriangle } from '../../Icons';

export type FileAttachmentPreviewProps<CustomLocalMetadata = unknown> =
  UploadAttachmentPreviewProps<LocalFileAttachment<CustomLocalMetadata>>;

export const FileAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: FileAttachmentPreviewProps) => {
  const { t } = useTranslationContext('FilePreview');
  const { id, uploadPermissionCheck, uploadState } = attachment.localMetadata ?? {};

  const hasSizeLimitError = uploadPermissionCheck?.reason === 'size_limit';
  const hasFatalError = uploadState === 'blocked' || hasSizeLimitError;
  const hasRetriableError = uploadState === 'failed' && !!handleRetry;
  const hasError = hasRetriableError || hasFatalError;

  return (
    <AttachmentPreviewRoot
      attachment={attachment}
      className='str-chat__attachment-preview-file'
      data-testid='attachment-preview-file'
    >
      <div className='str-chat__attachment-preview-file__icon'>
        <FileIcon fileName={attachment.title} mimeType={attachment.mime_type} />
      </div>

      <div className='str-chat__attachment-preview-file__info'>
        <div className='str-chat__attachment-preview-file-name' title={attachment.title}>
          {attachment.title}
        </div>
        <div className='str-chat__attachment-preview-file__data'>
          {uploadState === 'uploading' && <LoadingIndicatorIcon />}
          {!hasError && <FileSizeIndicator fileSize={attachment.file_size} />}
          {hasFatalError && (
            <div className='str-chat__attachment-preview-file__fatal-error'>
              <IconExclamationCircle />
              <span>
                {hasSizeLimitError
                  ? t('File too large')
                  : uploadState === 'blocked'
                    ? t('Upload blocked')
                    : t('Upload failed')}
              </span>
            </div>
          )}
          {hasRetriableError && (
            <div className='str-chat__attachment-preview-file__retriable-error'>
              <IconExclamationTriangle />
              <span>{t('Upload error')}</span>
              <button
                aria-label={t('aria/Retry upload')}
                className='str-chat__attachment-preview-file__retry-upload-button'
                data-testid='file-preview-item-retry-button'
                onClick={() => {
                  handleRetry(attachment);
                }}
                type='button'
              >
                {t('Retry upload')}
              </button>
            </div>
          )}
        </div>
      </div>

      <RemoveAttachmentPreviewButton
        data-testid='file-preview-item-delete-button'
        onClick={() => {
          if (id) removeAttachments([id]);
        }}
        uploadState={uploadState}
      />
    </AttachmentPreviewRoot>
  );
};
