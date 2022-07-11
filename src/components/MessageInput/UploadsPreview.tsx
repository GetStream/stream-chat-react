import React from 'react';
import { FilePreviewer, ImagePreviewer } from 'react-file-utils';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useMessageInputContext } from '../../context/MessageInputContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { useChatContext } from '../../context';

export const UploadsPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { themeVersion } = useChatContext('UploadsPreview');
  const { maxNumberOfFiles, multipleUploads } = useChannelStateContext<StreamChatGenerics>(
    'UploadsPreview',
  );
  const messageInput = useMessageInputContext<StreamChatGenerics>('UploadsPreview');
  const {
    fileOrder,
    fileUploads,
    imageOrder,
    imageUploads,
    numberOfUploads,
    removeFile,
    removeImage,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  } = messageInput;

  const imagesToPreview = imageOrder
    .map((id) => imageUploads[id])
    .filter((image) => !image.og_scrape_url);
  const filesToPreview = fileOrder.map((id) => fileUploads[id]);

  return (
    <>
      {imageOrder.length > 0 && (
        <ImagePreviewer
          disabled={
            !multipleUploads ||
            (maxNumberOfFiles !== undefined && numberOfUploads >= maxNumberOfFiles)
          }
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
