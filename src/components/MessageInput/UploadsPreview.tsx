import React, { useEffect } from 'react';
import { FilePreviewer, ImagePreviewer } from 'react-file-utils';

import { useBreakpoint } from '../Message/hooks';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useMessageInputContext } from '../../context/MessageInputContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export const UploadsPreview = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>() => {
  const { maxNumberOfFiles, multipleUploads } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>(
    'UploadsPreview',
  );
  const messageInput = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>('UploadsPreview');
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
          disabled={maxNumberOfFiles !== undefined && numberOfUploads >= maxNumberOfFiles}
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
