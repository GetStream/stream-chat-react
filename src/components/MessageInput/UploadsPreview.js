// @ts-check
import React, { useContext } from 'react';
// @ts-expect-error
import { FilePreviewer, ImagePreviewer } from 'react-file-utils';
import { ChannelContext } from '../../context';

/** @type {React.FC<import("types").MessageInputUploadsProps>} */
const UploadsPreview = ({
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

export default UploadsPreview;
