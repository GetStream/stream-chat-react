import React from 'react';
import { useTranslationContext } from '../../../context';
import { FileIcon } from '../../ReactFileUtilities';
import { CloseIcon, DownloadIcon, LoadingIndicatorIcon, RetryIcon } from '../icons';

import type {
  LocalAudioAttachment,
  LocalFileAttachment,
  LocalVideoAttachment,
} from 'stream-chat';
import type { UploadAttachmentPreviewProps } from './types';

export type FileAttachmentPreviewProps<CustomLocalMetadata = unknown> =
  UploadAttachmentPreviewProps<
    | LocalFileAttachment<CustomLocalMetadata>
    | LocalAudioAttachment<CustomLocalMetadata>
    | LocalVideoAttachment<CustomLocalMetadata>
  >;

export const FileAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: FileAttachmentPreviewProps) => {
  const { t } = useTranslationContext('FilePreview');
  const uploadState = attachment.localMetadata?.uploadState;

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
        disabled={uploadState === 'uploading'}
        onClick={() =>
          attachment.localMetadata?.id &&
          removeAttachments([attachment.localMetadata?.id])
        }
        type='button'
      >
        <CloseIcon />
      </button>

      {['blocked', 'failed'].includes(uploadState) && !!handleRetry && (
        <button
          className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file'
          data-testid='file-preview-item-retry-button'
          onClick={() => {
            handleRetry(attachment);
          }}
        >
          <RetryIcon />
        </button>
      )}

      <div className='str-chat__attachment-preview-file-end'>
        <div className='str-chat__attachment-preview-file-name' title={attachment.title}>
          {attachment.title}
        </div>
        {/* undefined if loaded from a draft */}
        {(typeof uploadState === 'undefined' || uploadState === 'finished') &&
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
        {uploadState === 'uploading' && <LoadingIndicatorIcon size={17} />}
      </div>
    </div>
  );
};
