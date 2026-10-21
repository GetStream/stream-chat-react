import React from 'react';
import { prettifyFileSize } from '../../MessageComposer/hooks/utils';

export type FileSizeIndicatorProps = {
  /** File size in bytes. Renders nothing when it is not a finite number. */
  fileSize?: number | string;
  /**
   * Significant digits of the formatted size, passed to `prettifyFileSize` as its precision. 0
   * rounds to an integer. When unset, `prettifyFileSize` uses 3.
   * @default undefined
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
