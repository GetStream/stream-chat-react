import React, { useCallback, useMemo } from 'react';
import { FileIcon, FilePreviewer, ImagePreviewer } from 'react-file-utils';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useMessageInputContext } from '../../context/MessageInputContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { useChatContext } from '../../context';

import { CloseIcon, DownloadIcon, LoadingIndicatorIcon, RetryIcon } from './icons';

export const UploadsPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { themeVersion } = useChatContext('UploadsPreview');
  const { maxNumberOfFiles = 0, multipleUploads } = useChannelStateContext<StreamChatGenerics>(
    'UploadsPreview',
  );
  const {
    fileOrder,
    fileUploads,
    imageOrder,
    imageUploads,
    numberOfUploads = 0,
    removeFile,
    removeImage,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  } = useMessageInputContext<StreamChatGenerics>('UploadsPreview');

  const imagesToPreview = imageOrder
    .map((id) => imageUploads[id])
    // filter OG scraped images
    .filter((image) => !image.og_scrape_url);
  const filesToPreview = fileOrder.map((id) => fileUploads[id]);

  return (
    <>
      {imageOrder.length > 0 && (
        <ImagePreviewer
          disabled={!multipleUploads || numberOfUploads >= maxNumberOfFiles}
          handleFiles={uploadNewFiles}
          handleRemove={removeImage}
          handleRetry={uploadImage}
          imageUploads={imagesToPreview}
          multiple={multipleUploads}
        />
      )}
      {fileOrder.length > 0 && (
        <FilePreviewer
          fileIconProps={{
            className: 'str-chat__file-icon',
            version: themeVersion,
          }}
          handleFiles={uploadNewFiles}
          handleRemove={removeFile}
          handleRetry={uploadFile}
          uploads={filesToPreview}
        />
      )}
    </>
  );
};

export const AttachmentPreviewList = () => {
  const { fileOrder, imageOrder } = useMessageInputContext('AttachmentPreviewList');

  return (
    <div className='str-chat__attachment-preview-list'>
      <div className='str-chat__attachment-list-scroll-container'>
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

const ImagePreviewItem = ({ id }: PreviewItemProps) => {
  const { imageUploads, removeImage, uploadImage } = useMessageInputContext('ImagePreviewItem');

  const handleRemove: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      removeImage(id);
    },
    [removeImage, id],
  );
  const handleRetry = useCallback(() => uploadImage(id), [uploadImage, id]);

  const image = imageUploads[id];
  const state = useFileState(image);

  // do not display scraped attachments
  if (!image || image.og_scrape_url) return null;

  return (
    <div className='str-chat__attachment-preview-image'>
      <button
        className='str-chat__attachment-preview-delete'
        disabled={state.uploading}
        onClick={handleRemove}
      >
        <CloseIcon />
      </button>

      {state.failed && (
        <button
          className='str-chat__attachment-preview-error str-chat__attachment-preview-error-image'
          onClick={handleRetry}
        >
          <RetryIcon />
        </button>
      )}

      {state.uploading && (
        <div className='str-chat__attachment-preview-image-loading'>
          <LoadingIndicatorIcon size={17} />
        </div>
      )}

      {/* TODO: investigage why previewUri does not get loaded instantly but only after upload finishes */}
      {(image.previewUri || image.url) && (
        <img
          alt={image.file.name}
          className='str-chat__attachment-preview-thumbnail'
          src={image.previewUri ?? image.url}
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
    <div className='str-chat__attachment-preview-file'>
      <div className='str-chat__attachment-preview-file-icon'>
        <FileIcon filename={file.file.name} version='2' />
      </div>

      <button
        className='str-chat__attachment-preview-delete'
        disabled={state.uploading}
        onClick={handleRemove}
      >
        <CloseIcon />
      </button>

      {state.failed && (
        <button
          className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file'
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

const useFileState = <T extends { state: 'failed' | 'finished' | 'uploading' }>(file: T) =>
  useMemo(
    () => ({
      failed: file.state === 'failed',
      finished: file.state === 'finished',
      uploading: file.state === 'uploading',
    }),
    [file.state],
  );
