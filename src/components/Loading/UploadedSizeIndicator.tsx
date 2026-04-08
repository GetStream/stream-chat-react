import React from 'react';

import { useComponentContext } from '../../context';
import { FileSizeIndicator as DefaultFileSizeIndicator } from '../Attachment/components/FileSizeIndicator';

export type UploadedSizeIndicatorProps = {
  fullBytes: number;
  uploadedBytes: number;
};

export const UploadedSizeIndicator = ({
  fullBytes,
  uploadedBytes,
}: UploadedSizeIndicatorProps) => {
  const { FileSizeIndicator = DefaultFileSizeIndicator } = useComponentContext();
  return (
    <div
      className='str-chat__attachment-preview-file__upload-size-fraction'
      data-testid='upload-size-fraction'
    >
      <FileSizeIndicator fileSize={uploadedBytes} /> {` / `}
      <FileSizeIndicator fileSize={fullBytes} />
    </div>
  );
};
