import React, { PropsWithChildren } from 'react';

import { PictureIcon } from './icons';
import { UploadButton } from './UploadButton';
import { useTranslationContext } from '../../context';

export type ImageUploadButtonProps = {
  handleFiles: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  resetOnChange?: boolean;
};

/**
 * @deprecated will be removed in the next major release
 */
export const ImageUploadButton = ({
  multiple = false,
  disabled = false,
  handleFiles,
  children = <PictureIcon />,
  resetOnChange = false,
}: PropsWithChildren<ImageUploadButtonProps>) => {
  const { t } = useTranslationContext('ImageUploadButton');
  return (
    <div className='rfu-image-upload-button'>
      <label>
        <UploadButton
          accept='image/*'
          aria-label={t('aria/Image input')}
          className='rfu-image-input'
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
