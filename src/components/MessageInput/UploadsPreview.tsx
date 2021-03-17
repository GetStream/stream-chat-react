import React from 'react';
// @ts-expect-error
import { FilePreviewer, ImagePreviewer } from 'react-file-utils';

import { useChannelContext } from '../../context/ChannelContext';

import type { MessageInputState } from './hooks/messageInput';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export type MessageInputUploadsProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = MessageInputState<At, Us> & {
  removeFile?: (id: string) => void;
  removeImage?: (id: string) => void;
  uploadFile?: (id: string) => void;
  uploadImage?: (id: string) => void;
  uploadNewFiles?: (files: FileList) => void;
};

export const UploadsPreview = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageInputUploadsProps<At, Us>,
) => {
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
  } = props;

  const channelContext = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <>
      {imageOrder.length > 0 && (
        <ImagePreviewer
          disabled={
            channelContext.maxNumberOfFiles !== undefined &&
            numberOfUploads >= channelContext.maxNumberOfFiles
          }
          handleFiles={uploadNewFiles}
          handleRemove={removeImage}
          handleRetry={uploadImage}
          imageUploads={imageOrder.map((id) => imageUploads[id])}
          multiple={channelContext.multipleUploads}
        />
      )}
      {fileOrder.length > 0 && (
        <FilePreviewer
          handleFiles={uploadNewFiles}
          handleRemove={removeFile}
          handleRetry={uploadFile}
          uploads={fileOrder.map((id) => fileUploads[id])}
        />
      )}
    </>
  );
};
