import React, { useEffect } from 'react';
import { FilePreviewer, ImagePreviewer } from 'react-file-utils';

import { useBreakpoint } from '../Message/hooks';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useMessageInputContext } from '../../context/MessageInputContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export const UploadsPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
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
    text,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  } = messageInput;

  const imagesToPreview = imageOrder.map((id) => imageUploads[id]);
  const filesToPreview = fileOrder.map((id) => fileUploads[id]);

  const { device } = useBreakpoint();

  useEffect(() => {
    const elements = document.getElementsByClassName('str-chat__send-button');
    const sendButton = elements.item(0);

    if (sendButton instanceof HTMLButtonElement) {
      if ((numberOfUploads && !text) || device !== 'full') {
        sendButton.style.display = 'block';
      } else {
        sendButton.style.display = 'none';
      }
    }
  }, [device, numberOfUploads, text]);

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
          handleFiles={uploadNewFiles}
          handleRemove={removeFile}
          handleRetry={uploadFile}
          uploads={filesToPreview}
        />
      )}
    </>
  );
};
