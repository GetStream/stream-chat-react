import clsx from 'clsx';
import { CloseIcon, LoadingIndicatorIcon, RetryIcon } from '../icons';
import React, { useCallback, useState } from 'react';
import { BaseImage as DefaultBaseImage } from '../../Gallery';
import { useComponentContext } from '../../../context';
import type { AttachmentPreviewProps } from './types';
import type { LocalImageAttachment } from '../types';
import type { DefaultStreamChatGenerics } from '../../../types';

export type ImageAttachmentPreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  CustomLocalMetadata = Record<string, unknown>
> = AttachmentPreviewProps<
  LocalImageAttachment<StreamChatGenerics, CustomLocalMetadata>,
  StreamChatGenerics
>;

export const ImageAttachmentPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachment,
  handleRetry,
  removeAttachments,
}: ImageAttachmentPreviewProps<StreamChatGenerics>) => {
  const { BaseImage = DefaultBaseImage } = useComponentContext('ImagePreview');
  const [previewError, setPreviewError] = useState(false);

  const { id, uploadState } = attachment.localMetadata ?? {};

  const handleLoadError = useCallback(() => setPreviewError(true), []);

  return (
    <div
      className={clsx('str-chat__attachment-preview-image', {
        'str-chat__attachment-preview-image--error': previewError,
      })}
      data-testid='attachment-preview-image'
    >
      <button
        className='str-chat__attachment-preview-delete'
        data-testid='image-preview-item-delete-button'
        disabled={uploadState === 'uploading'}
        onClick={() => id && removeAttachments([id])}
      >
        <CloseIcon />
      </button>

      {uploadState === 'failed' && (
        <button
          className='str-chat__attachment-preview-error str-chat__attachment-preview-error-image'
          data-testid='image-preview-item-retry-button'
          onClick={() => handleRetry(attachment)}
        >
          <RetryIcon />
        </button>
      )}

      {uploadState === 'uploading' && (
        <div className='str-chat__attachment-preview-image-loading'>
          <LoadingIndicatorIcon size={17} />
        </div>
      )}

      {attachment.image_url && (
        <BaseImage
          alt={attachment.title}
          className='str-chat__attachment-preview-thumbnail'
          onError={handleLoadError}
          src={attachment.image_url}
          title={attachment.title}
        />
      )}
    </div>
  );
};
