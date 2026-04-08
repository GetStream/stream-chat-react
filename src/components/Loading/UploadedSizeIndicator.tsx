import React from 'react';

import { FileSizeIndicator } from '../Attachment';

export type UploadedSizeIndicatorProps = {
  fullBytes: number;
  uploadedBytes: number;
};

export const UploadedSizeIndicator = ({
  fullBytes,
  uploadedBytes,
}: UploadedSizeIndicatorProps) => (
  <div
    className='str-chat__attachment-preview-file__upload-size-fraction'
    data-testid='upload-size-fraction'
  >
    <FileSizeIndicator fileSize={uploadedBytes} /> {` / `}
    <FileSizeIndicator fileSize={fullBytes} />
  </div>
);
