import React, { PropsWithChildren } from 'react';

import { AttachmentIcon } from './AttachmentIcon';
import { useHandleFileChangeWrapper } from './utils';

export type FileUploadButtonProps = {
  handleFiles: (files: FileList | File[]) => void;
  accepts?: string | string[];
  disabled?: boolean;
  multiple?: boolean;
  resetOnChange?: boolean;
};

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

  const onFileChange = useHandleFileChangeWrapper(resetOnChange, handleFiles);

  return (
    <div className={className}>
      <label>
        <input
          accept={Array.isArray(accepts) ? accepts.join(',') : accepts}
          aria-label='File input'
          className='rfu-file-input'
          disabled={disabled}
          multiple={multiple}
          onChange={onFileChange}
          type='file'
        />
        {children}
      </label>
    </div>
  );
};
