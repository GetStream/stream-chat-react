import React, { useContext } from 'react';
import { ImagePreviewer, FilePreviewer } from 'react-file-utils';
import { ChannelContext } from 'stream-chat-react';

export const UploadsPreview = ({
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
}) => {
  const channelContext = useContext(ChannelContext);

  return (
    <>
      {imageOrder.length > 0 && (
        <ImagePreviewer
          imageUploads={imageOrder.map((id) => imageUploads[id])}
          handleRemove={removeImage}
          handleRetry={uploadImage}
          handleFiles={uploadNewFiles}
          multiple={channelContext.multipleUploads}
          disabled={
            channelContext.maxNumberOfFiles !== undefined &&
            numberOfUploads >= channelContext.maxNumberOfFiles
          }
        />
      )}
      {fileOrder.length > 0 && (
        <FilePreviewer
          uploads={fileOrder.map((id) => fileUploads[id])}
          handleRemove={removeFile}
          handleRetry={uploadFile}
          handleFiles={uploadNewFiles}
        />
      )}
    </>
  );
};
