import clsx from 'clsx';
import React, { useCallback, useState } from 'react';

import { BaseImage as DefaultBaseImage } from '../Gallery';
import { FileIcon } from '../ReactFileUtilities';

import { CloseIcon, DownloadIcon, LoadingIndicatorIcon, RetryIcon } from './icons';
import { isScrapedContent } from '../Attachment';
import {
  isMessageComposerFileAttachment,
  isMessageComposerImageAttachment,
} from './hooks/useAttachments';
import { useComponentContext, useMessageInputContext } from '../../context';

import {
  MessageComposerFileAttachment,
  MessageComposerImageAttachment,
  UploadState,
} from './types';

export const AttachmentPreviewList = () => {
  const { attachments } = useMessageInputContext('AttachmentPreviewList');

  return (
    <div className='str-chat__attachment-preview-list'>
      <div
        className='str-chat__attachment-list-scroll-container'
        data-testid='attachment-list-scroll-container'
      >
        {attachments.map((attachment) => {
          if (isMessageComposerFileAttachment(attachment)) {
            return <FilePreviewItem attachment={attachment} key={attachment.id} />;
          } else if (isMessageComposerImageAttachment(attachment)) {
            return <ImagePreviewItem attachment={attachment} key={attachment.id} />;
          } else {
            return null;
          }
        })}
      </div>
    </div>
  );
};

type ImagePreviewItemProps = {
  attachment: MessageComposerImageAttachment;
};

export const ImagePreviewItem = ({ attachment }: ImagePreviewItemProps) => {
  const { BaseImage = DefaultBaseImage } = useComponentContext('ImagePreviewItem');
  const { removeAttachment, uploadImage } = useMessageInputContext('ImagePreviewItem');
  const [previewError, setPreviewError] = useState(false);

  const handleRemove: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      removeAttachment(attachment.id);
    },
    [removeAttachment, attachment.id],
  );
  const handleRetry = useCallback(() => uploadImage(attachment.id), [uploadImage, attachment.id]);
  const handleLoadError = useCallback(() => setPreviewError(true), []);

  if (isScrapedContent(attachment)) return null;

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
        disabled={attachment.uploadState === UploadState.uploading}
        onClick={handleRemove}
      >
        <CloseIcon />
      </button>

      {attachment.uploadState === UploadState.failed && (
        <button
          className='str-chat__attachment-preview-error str-chat__attachment-preview-error-image'
          data-testid='image-preview-item-retry-button'
          onClick={handleRetry}
        >
          <RetryIcon />
        </button>
      )}

      {attachment.uploadState === UploadState.uploading && (
        <div className='str-chat__attachment-preview-image-loading'>
          <LoadingIndicatorIcon size={17} />
        </div>
      )}

      {(attachment.previewUri || attachment.image_url) && (
        <BaseImage
          alt={attachment.file?.name || attachment?.title}
          className='str-chat__attachment-preview-thumbnail'
          onError={handleLoadError}
          src={attachment.previewUri ?? attachment.image_url}
          title={attachment.file.name}
        />
      )}
    </div>
  );
};

type FilePreviewItemProps = {
  attachment: MessageComposerFileAttachment;
};

const FilePreviewItem = ({ attachment }: FilePreviewItemProps) => {
  const { removeAttachment, uploadFile } = useMessageInputContext('FilePreviewItem');

  const handleRemove: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      removeAttachment(attachment.id);
    },
    [removeAttachment, attachment.id],
  );
  const handleRetry = useCallback(() => uploadFile(attachment.id), [uploadFile, attachment.id]);

  return (
    <div className='str-chat__attachment-preview-file' data-testid='attachment-preview-file'>
      <div className='str-chat__attachment-preview-file-icon'>
        <FileIcon filename={attachment?.file?.name} mimeType={attachment?.mime_type} version='2' />
      </div>

      <button
        className='str-chat__attachment-preview-delete'
        data-testid='file-preview-item-delete-button'
        disabled={attachment.uploadState === UploadState.uploading}
        onClick={handleRemove}
      >
        <CloseIcon />
      </button>

      {attachment.uploadState === UploadState.failed && (
        <button
          className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file'
          data-testid='file-preview-item-retry-button'
          onClick={handleRetry}
        >
          <RetryIcon />
        </button>
      )}

      <div className='str-chat__attachment-preview-file-end'>
        <div className='str-chat__attachment-preview-file-name'>
          {attachment?.file?.name || attachment?.title}
        </div>
        {attachment.uploadState === UploadState.finished && (
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
        {attachment.uploadState === UploadState.uploading && <LoadingIndicatorIcon size={17} />}
      </div>
    </div>
  );
};
