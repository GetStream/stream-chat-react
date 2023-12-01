import clsx from 'clsx';
import React, { useCallback, useState } from 'react';

import { BaseImage as DefaultBaseImage } from '../Gallery';
import { FileIcon } from '../ReactFileUtilities';
import { useComponentContext, useMessageInputContext } from '../../context';
import { useFileState } from './hooks/useFileState';

import { CloseIcon, DownloadIcon, LoadingIndicatorIcon, RetryIcon } from './icons';

export const AttachmentPreviewList = () => {
  const { fileOrder, imageOrder } = useMessageInputContext('AttachmentPreviewList');

  return (
    <div className='str-chat__attachment-preview-list'>
      <div
        className='str-chat__attachment-list-scroll-container'
        data-testid='attachment-list-scroll-container'
      >
        {imageOrder.map((id) => (
          <ImagePreviewItem id={id} key={id} />
        ))}
        {fileOrder.map((id) => (
          <FilePreviewItem id={id} key={id} />
        ))}
      </div>
    </div>
  );
};

type PreviewItemProps = { id: string };

export const ImagePreviewItem = ({ id }: PreviewItemProps) => {
  const { BaseImage = DefaultBaseImage } = useComponentContext('ImagePreviewItem');
  const { imageUploads, removeImage, uploadImage } = useMessageInputContext('ImagePreviewItem');
  const [previewError, setPreviewError] = useState(false);

  const handleRemove: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      removeImage(id);
    },
    [removeImage, id],
  );
  const handleRetry = useCallback(() => uploadImage(id), [uploadImage, id]);

  const handleLoadError = useCallback(() => setPreviewError(true), []);

  const image = imageUploads[id];
  // do not display scraped attachments
  if (!image || image.og_scrape_url) return null;

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
        disabled={image.state === 'uploading'}
        onClick={handleRemove}
      >
        <CloseIcon />
      </button>

      {image.state === 'failed' && (
        <button
          className='str-chat__attachment-preview-error str-chat__attachment-preview-error-image'
          data-testid='image-preview-item-retry-button'
          onClick={handleRetry}
        >
          <RetryIcon />
        </button>
      )}

      {image.state === 'uploading' && (
        <div className='str-chat__attachment-preview-image-loading'>
          <LoadingIndicatorIcon size={17} />
        </div>
      )}

      {(image.previewUri || image.url) && (
        <BaseImage
          alt={image.file.name}
          className='str-chat__attachment-preview-thumbnail'
          onError={handleLoadError}
          src={image.previewUri ?? image.url}
          title={image.file.name}
        />
      )}
    </div>
  );
};

const FilePreviewItem = ({ id }: PreviewItemProps) => {
  const { fileUploads, removeFile, uploadFile } = useMessageInputContext('FilePreviewItem');

  const handleRemove: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      removeFile(id);
    },
    [removeFile, id],
  );
  const handleRetry = useCallback(() => uploadFile(id), [uploadFile, id]);

  const file = fileUploads[id];
  const state = useFileState(file);

  if (!file) return null;

  return (
    <div className='str-chat__attachment-preview-file' data-testid='attachment-preview-file'>
      <div className='str-chat__attachment-preview-file-icon'>
        <FileIcon filename={file.file.name} mimeType={file.file.type} version='2' />
      </div>

      <button
        className='str-chat__attachment-preview-delete'
        data-testid='file-preview-item-delete-button'
        disabled={state.uploading}
        onClick={handleRemove}
      >
        <CloseIcon />
      </button>

      {state.failed && (
        <button
          className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file'
          data-testid='file-preview-item-retry-button'
          onClick={handleRetry}
        >
          <RetryIcon />
        </button>
      )}

      <div className='str-chat__attachment-preview-file-end'>
        <div className='str-chat__attachment-preview-file-name'>{file.file.name}</div>
        {state.finished && (
          <a
            className='str-chat__attachment-preview-file-download'
            download
            href={file.url}
            rel='noreferrer'
            target='_blank'
          >
            <DownloadIcon />
          </a>
        )}
        {state.uploading && <LoadingIndicatorIcon size={17} />}
      </div>
    </div>
  );
};
