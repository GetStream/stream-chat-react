import React from 'react';
import { prettifyFileSize } from '../../MessageInput/hooks/utils';

type FileSizeIndicatorProps = {
  /** file size in byte */
  fileSize?: number;
  /**
   The maximum number of fraction digits to display. If not set, the default behavior is to round to 3 significant digits.
   @default undefined
   */
  maximumFractionDigits?: number;
};

export const FileSizeIndicator = ({ fileSize, maximumFractionDigits }: FileSizeIndicatorProps) => {
  if (!(fileSize && Number.isFinite(Number(fileSize)))) return null;

  return (
    <span
      className='str-chat__message-attachment-file--item-size'
      data-testid='file-size-indicator'
    >
      {prettifyFileSize(fileSize, maximumFractionDigits)}
    </span>
  );
};
