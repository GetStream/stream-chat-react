import React from 'react';
import { isLocalUploadAttachment } from 'stream-chat';
import { CloseIcon, DownloadIcon, LoadingIndicatorIcon, RetryIcon } from '../icons';
import { FileIcon } from '../../ReactFileUtilities';
import { useTranslationContext } from '../../../context';
import type { AnyLocalAttachment, LocalUploadAttachment } from 'stream-chat';

export type UnsupportedAttachmentPreviewProps<
  CustomLocalMetadata = Record<string, unknown>,
> = {
  attachment: AnyLocalAttachment<CustomLocalMetadata>;
  handleRetry: (
    attachment: LocalUploadAttachment,
  ) => void | Promise<LocalUploadAttachment | undefined>;
  removeAttachments: (ids: string[]) => void;
};

export const UnsupportedAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: UnsupportedAttachmentPreviewProps) => {
  const { t } = useTranslationContext('UnsupportedAttachmentPreview');
  const title = attachment.title ?? t('Unsupported attachment');
  return (
    <div
      className='str-chat__attachment-preview-unsupported'
      data-testid='attachment-preview-unknown'
    >
      <div className='str-chat__attachment-preview-file-icon'>
        <FileIcon filename={title} mimeType={attachment.mime_type} />
      </div>

      <button
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

      {isLocalUploadAttachment(attachment) &&
        attachment.localMetadata?.uploadState === 'failed' &&
        !!handleRetry && (
          <button
            className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file'
            data-testid='file-preview-item-retry-button'
            onClick={() => handleRetry(attachment)}
          >
            <RetryIcon />
          </button>
        )}

      <div className='str-chat__attachment-preview-metadata'>
        <div className='str-chat__attachment-preview-title' title={title}>
          {title}
        </div>
        {attachment.localMetadata?.uploadState === 'finished' &&
          !!attachment.asset_url && (
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
        {attachment.localMetadata?.uploadState === 'uploading' && (
          <LoadingIndicatorIcon size={17} />
        )}
      </div>
    </div>
  );
};
