import React from 'react';
import { useTranslationContext } from '../../../context';
import { FileIcon } from '../../FileIcon';
import { UploadProgressIndicator } from '../../Loading/UploadProgressIndicator';
import { AttachmentUploadedSizeIndicator } from './AttachmentUploadedSizeIndicator';
import type { LocalAudioAttachment, LocalFileAttachment } from 'stream-chat';
import type { UploadAttachmentPreviewProps } from './types';
import { RemoveAttachmentPreviewButton } from '../RemoveAttachmentPreviewButton';
import { AttachmentPreviewRoot } from './utils/AttachmentPreviewRoot';
import { IconExclamationMark, IconExclamationTriangleFill } from '../../Icons';

export type FileAttachmentPreviewProps<CustomLocalMetadata = unknown> =
  UploadAttachmentPreviewProps<
    LocalFileAttachment<CustomLocalMetadata> | LocalAudioAttachment<CustomLocalMetadata>
  >;

export const FileAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: FileAttachmentPreviewProps) => {
  const { t } = useTranslationContext();
  const { id, uploadPermissionCheck, uploadProgress, uploadState } =
    attachment.localMetadata ?? {};

  const hasSizeLimitError = uploadPermissionCheck?.reason === 'size_limit';
  const hasFatalError = uploadState === 'blocked' || hasSizeLimitError;
  const hasRetriableError = uploadState === 'failed' && !!handleRetry;

  return (
    <AttachmentPreviewRoot
      attachment={attachment}
      className='str-chat__attachment-preview-file'
      data-testid='attachment-preview-file'
    >
      <div className='str-chat__attachment-preview-file__icon'>
        <FileIcon fileName={attachment.title} mimeType={attachment.custom?.mime_type} />
      </div>

      <div className='str-chat__attachment-preview-file__info'>
        <div className='str-chat__attachment-preview-file-name' title={attachment.title}>
          {attachment.title}
        </div>
        <div className='str-chat__attachment-preview-file__data'>
          {uploadState === 'uploading' && (
            <UploadProgressIndicator uploadProgress={uploadProgress} />
          )}
          <AttachmentUploadedSizeIndicator attachment={attachment} />
          {hasFatalError && (
            <div className='str-chat__attachment-preview-file__fatal-error'>
              <IconExclamationMark />
              <span>
                {hasSizeLimitError
                  ? t(
                      'messageComposer.audioAttachmentPreview.fileTooLarge.text',
                      'File too large',
                    )
                  : uploadState === 'blocked'
                    ? t(
                        'messageComposer.audioAttachmentPreview.uploadBlocked.text',
                        'Upload blocked',
                      )
                    : t(
                        'messageComposer.audioAttachmentPreview.uploadFailed.text',
                        'Upload failed',
                      )}
              </span>
            </div>
          )}
          {hasRetriableError && (
            <div className='str-chat__attachment-preview-file__retriable-error'>
              <IconExclamationTriangleFill />
              <span>
                {t(
                  'messageComposer.audioAttachmentPreview.uploadError.text',
                  'Upload error',
                )}
              </span>
              <button
                aria-label={t('common.retryUpload.ariaLabel', 'Retry upload')}
                className='str-chat__attachment-preview-file__retry-upload-button'
                data-testid='file-preview-item-retry-button'
                onClick={() => {
                  handleRetry(attachment);
                }}
                type='button'
              >
                {t(
                  'messageComposer.audioAttachmentPreview.retryUpload.text',
                  'Retry upload',
                )}
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
