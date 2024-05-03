import clsx from 'clsx';
import { CloseIcon, LoadingIndicatorIcon, RetryIcon } from '../icons';
import React, { useCallback, useState } from 'react';
import { AttachmentPreviewProps } from './types';
import { BaseImage as DefaultBaseImage } from '../../Gallery';
import { useComponentContext } from '../../../context';

export type ImageAttachmentPreviewProps = AttachmentPreviewProps;

export const ImageAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: ImageAttachmentPreviewProps) => {
  const { BaseImage = DefaultBaseImage } = useComponentContext('ImagePreview');
  const [previewError, setPreviewError] = useState(false);

  const { id, uploadState } = attachment.$internal ?? {};

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
