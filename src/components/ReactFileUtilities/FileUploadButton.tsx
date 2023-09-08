import React, { PropsWithChildren } from 'react';

import { AttachmentIcon } from './icons';
import { UploadButton } from './UploadButton';

export type FileUploadButtonProps = {
  handleFiles: (files: FileList | File[]) => void;
  accepts?: string | string[];
  disabled?: boolean;
  multiple?: boolean;
  resetOnChange?: boolean;
};

/**
 * @deprecated will be removed in the next major release
 */
export const FileUploadButton = ({
  disabled = false,
  multiple = false,
  children = <AttachmentIcon />,
  handleFiles,
  accepts,
  resetOnChange = true,
}: PropsWithChildren<FileUploadButtonProps>) => {
  let className = 'rfu-file-upload-button';
  if (disabled) {
    className = `${className} rfu-file-upload-button--disabled`;
  }

  return (
    <div className={className}>
      <label>
        <UploadButton
          accept={Array.isArray(accepts) ? accepts.join(',') : accepts}
          aria-label='File input'
          className='rfu-file-input'
          disabled={disabled}
          multiple={multiple}
          onFileChange={handleFiles}
          resetOnChange={resetOnChange}
        />
        {children}
      </label>
    </div>
  );
};
