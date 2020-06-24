// @ts-check
import React, { useContext } from 'react';
// @ts-ignore
import { ImagePreviewer, FilePreviewer } from 'react-file-utils';
import { ChannelContext } from '../../context';

/** @type {React.FC<import("types").MessageInputUploadsProps>} */
const UploadsPreview = ({
  imageOrder,
  imageUploads,
  removeImage,
  uploadImage,
  uploadNewFiles,
  numberOfUploads,
  fileOrder,
  fileUploads,
  removeFile,
  uploadFile,
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

export default UploadsPreview;
