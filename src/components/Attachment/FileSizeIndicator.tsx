import React from 'react';
import prettybytes from 'pretty-bytes';

type FileSizeIndicatorProps = {
  fileSize?: number;
};

export const FileSizeIndicator = ({ fileSize }: FileSizeIndicatorProps) => {
  if (!(fileSize && Number.isFinite(Number(fileSize)))) return null;

  return (
    <span className='str-chat__message-attachment-file--item-size'>{prettybytes(fileSize)}</span>
  );
};
