import React, { PropsWithChildren } from 'react';

import { PictureIcon } from './PictureIcon';
import { useHandleFileChangeWrapper } from './utils';

export type ImageUploadButtonProps = {
  handleFiles: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  resetOnChange?: boolean;
};

export const ImageUploadButton = ({
  multiple = false,
  disabled = false,
  handleFiles,
  children = <PictureIcon />,
  resetOnChange = false,
}: PropsWithChildren<ImageUploadButtonProps>) => {
  const onFileChange = useHandleFileChangeWrapper(resetOnChange, handleFiles);

  return (
    <div className='rfu-image-upload-button'>
      <label>
        <input
          accept='image/*'
          aria-label='Image input'
          className='rfu-image-input'
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
