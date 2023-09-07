import React, { ComponentProps } from 'react';

import { useHandleFileChangeWrapper } from './utils';

export type UploadButtonProps = {
  onFileChange: (files: Array<File>) => void;
  resetOnChange?: boolean;
} & Omit<ComponentProps<'input'>, 'type' | 'onChange'>;

export const UploadButton = ({
  onFileChange,
  resetOnChange = true,
  ...rest
}: UploadButtonProps) => {
  const handleInputChange = useHandleFileChangeWrapper(resetOnChange, onFileChange);

  return <input onChange={handleInputChange} type='file' {...rest} />;
};
