import React from 'react';
import { prettifyFileSize } from '../../MessageInput/hooks/utils';

type FileSizeIndicatorProps = {
  /** file size in byte */
  fileSize?: number | string;
  /**
   The maximum number of fraction digits to display. If not set, the default behavior is to round to 3 significant digits.
   @default undefined
   */
  maximumFractionDigits?: number;
};

export const FileSizeIndicator = ({
  fileSize,
  maximumFractionDigits,
}: FileSizeIndicatorProps) => {
  const actualFileSize = typeof fileSize === 'string' ? parseFloat(fileSize) : fileSize;

  if (typeof actualFileSize === 'undefined' || !Number.isFinite(Number(actualFileSize))) {
    return null;
  }

  return (
    <span
      className='str-chat__message-attachment-file--item-size'
      data-testid='file-size-indicator'
    >
      {prettifyFileSize(actualFileSize, maximumFractionDigits)}
    </span>
  );
};
