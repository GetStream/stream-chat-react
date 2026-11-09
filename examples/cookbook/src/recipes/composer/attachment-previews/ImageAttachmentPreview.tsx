import { isUploadConfirmationPending } from 'stream-chat';
import type { ImageAttachmentPreviewProps } from 'stream-chat-react';
import {
  RemoveAttachmentPreviewButton,
  UploadProgressIndicator,
  useComponentContextIcons,
} from 'stream-chat-react';

export const ImageAttachmentPreview = ({
  attachment,
  handleRetry,
  openPreview,
  removeAttachments,
}: ImageAttachmentPreviewProps) => {
  const { IconExclamationMark } = useComponentContextIcons();
  const { id, previewUri, uploadPermissionCheck, uploadProgress, uploadState } =
    attachment.localMetadata;
  // The local file until the upload finishes, then the uploaded image.
  const src = attachment.image_url || previewUri;
  // Blocked, or over the size limit: retrying can't help, so the preview only shows the error.
  const cannotUpload =
    uploadState === 'blocked' || uploadPermissionCheck?.reason === 'size_limit';
  const canRetry = uploadState === 'failed' && !cannotUpload;

  return (
    <div className='cookbook-image-preview'>
      <button
        aria-label='Open image'
        className='cookbook-image-preview__thumbnail'
        disabled={uploadState !== 'finished' || cannotUpload}
        onClick={openPreview}
        type='button'
      >
        {src && <img alt='' src={src} />}
      </button>
      {uploadState === 'uploading' && (
        <div className='cookbook-image-preview__progress'>
          <UploadProgressIndicator
            // True while the file is sent but the server hasn't confirmed it: a spinner, not 100%.
            uploadConfirmationPending={isUploadConfirmationPending(
              attachment.localMetadata,
            )}
            uploadProgress={uploadProgress}
          />
        </div>
      )}
      {cannotUpload && (
        <div
          aria-label="Can't upload"
          className='cookbook-image-preview__error'
          role='img'
        >
          <IconExclamationMark />
        </div>
      )}
      {canRetry && (
        <button
          className='cookbook-image-preview__retry'
          onClick={() => handleRetry(attachment)}
          type='button'
        >
          Retry
        </button>
      )}
      <RemoveAttachmentPreviewButton
        onClick={() => removeAttachments([id])}
        uploadState={uploadState}
      />
    </div>
  );
};
